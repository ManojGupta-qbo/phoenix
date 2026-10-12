"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AppointmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { createSession, destroySession, requireUser } from "@/lib/session";
import { audit, getAppointmentFor } from "@/lib/access";

export type FormState = { error?: string } | undefined;

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().toLowerCase(),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["PATIENT", "EXPERT"]),
  specialty: z.string().trim().optional(),
  qualifications: z.string().trim().optional(),
  consent: z.literal("on", { error: "Consent is required" }),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.role === "EXPERT" && (!d.specialty || !d.qualifications))
    return { error: "Experts must provide specialty and qualifications" };
  if (await db.user.findUnique({ where: { email: d.email } })) return { error: "Email already registered" };

  const user = await db.user.create({
    data: {
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      passwordHash: await bcrypt.hash(d.password, 12),
      role: d.role,
      expertProfile:
        d.role === "EXPERT"
          ? { create: { specialty: d.specialty!, qualifications: d.qualifications!, bio: "" } }
          : undefined,
    },
  });
  await audit(user.id, "REGISTER", `user:${user.id}`);
  await createSession({ userId: user.id, role: user.role });
  redirect("/dashboard");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "Invalid email or password" };
  await audit(user.id, "LOGIN", `user:${user.id}`);
  await createSession({ userId: user.id, role: user.role });
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

const bookSchema = z.object({
  expertId: z.string(),
  mode: z.enum(["VIDEO", "CHAT", "ASYNC"]),
  slotId: z.string().optional(),
  reason: z.string().trim().min(5, "Please describe your concern"),
});

export async function bookAppointment(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser(["PATIENT"]);
  const parsed = bookSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { expertId, mode, slotId, reason } = parsed.data;

  const expert = await db.expertProfile.findFirst({ where: { id: expertId, verified: true } });
  if (!expert) return { error: "Expert not available" };
  if (mode !== "ASYNC" && !slotId) return { error: "Choose a time slot" };

  const appt = await db.$transaction(async (tx) => {
    if (mode !== "ASYNC") {
      // Atomic claim: fails if another patient booked the slot first.
      const claimed = await tx.slot.updateMany({
        where: { id: slotId, expertId, booked: false, startsAt: { gt: new Date() } },
        data: { booked: true },
      });
      if (claimed.count !== 1) return null;
    }
    return tx.appointment.create({
      data: { patientId: user.id, expertId, mode, reason, slotId: mode === "ASYNC" ? null : slotId },
    });
  });
  if (!appt) return { error: "That slot was just taken — pick another" };
  await audit(user.id, "BOOK", `appointment:${appt.id}`);
  redirect(`/appointments/${appt.id}`);
}

const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function setStatus(appointmentId: string, status: AppointmentStatus) {
  const user = await requireUser();
  const appt = await getAppointmentFor(user, appointmentId);
  if (!appt || !transitions[appt.status].includes(status)) return;
  // Patients may only cancel; experts/admins drive the rest.
  if (user.role === "PATIENT" && status !== "CANCELLED") return;

  await db.$transaction([
    db.appointment.update({ where: { id: appt.id }, data: { status } }),
    ...(status === "CANCELLED" && appt.slotId
      ? [db.slot.update({ where: { id: appt.slotId }, data: { booked: false } })]
      : []),
  ]);
  await audit(user.id, `STATUS_${status}`, `appointment:${appt.id}`);
  revalidatePath(`/appointments/${appt.id}`);
}

export async function saveNotes(appointmentId: string, form: FormData) {
  const user = await requireUser(["EXPERT"]);
  const appt = await getAppointmentFor(user, appointmentId);
  if (!appt || appt.expertId !== user.expertProfile?.id) return;
  await db.appointment.update({ where: { id: appt.id }, data: { notes: String(form.get("notes") ?? "") } });
  await audit(user.id, "NOTES_UPDATE", `appointment:${appt.id}`);
  revalidatePath(`/appointments/${appt.id}`);
}

const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  minutes: z.coerce.number().int().min(10).max(120),
  tzOffset: z.coerce.number().int(), // browser's getTimezoneOffset(), in minutes
});

export async function addSlot(form: FormData) {
  const user = await requireUser(["EXPERT"]);
  const parsed = slotSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success || !user.expertProfile) return;
  const { date, time, minutes, tzOffset } = parsed.data;
  const startsAt = new Date(Date.parse(`${date}T${time}:00Z`) + tzOffset * 60_000);
  if (startsAt <= new Date()) return;
  await db.slot.create({
    data: { expertId: user.expertProfile.id, startsAt, endsAt: new Date(startsAt.getTime() + minutes * 60_000) },
  });
  revalidatePath("/expert/availability");
}

export async function deleteSlot(slotId: string) {
  const user = await requireUser(["EXPERT"]);
  await db.slot.deleteMany({ where: { id: slotId, expertId: user.expertProfile?.id, booked: false } });
  revalidatePath("/expert/availability");
}

export async function updateProfile(form: FormData) {
  const user = await requireUser(["EXPERT"]);
  if (!user.expertProfile) return;
  const fee = Math.max(0, Math.round(Number(form.get("fee") ?? 0) * 100)) || 0;
  await db.expertProfile.update({
    where: { id: user.expertProfile.id },
    data: {
      specialty: String(form.get("specialty") ?? user.expertProfile.specialty),
      bio: String(form.get("bio") ?? ""),
      feeCents: fee,
    },
  });
  revalidatePath("/expert/availability");
}

export async function setExpertVerified(expertId: string, verified: boolean) {
  const user = await requireUser(["ADMIN"]);
  await db.expertProfile.update({ where: { id: expertId }, data: { verified } });
  await audit(user.id, verified ? "EXPERT_VERIFY" : "EXPERT_UNVERIFY", `expert:${expertId}`);
  revalidatePath("/admin");
}
