import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getAppointmentFor } from "@/lib/access";

async function authorize(appointmentId: string) {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.userId }, include: { expertProfile: true } });
  if (!user) return null;
  const appt = await getAppointmentFor(user, appointmentId);
  return appt ? { user, appt } : null;
}

// Live chat polls this with ?after=<ISO timestamp> to fetch only new messages.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize((await params).id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const after = new URL(req.url).searchParams.get("after");
  const messages = await db.message.findMany({
    where: { appointmentId: ctx.appt.id, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true, role: true } } },
  });
  return NextResponse.json(messages);
}

const bodySchema = z.object({ body: z.string().trim().min(1).max(4000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize((await params).id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.appt.status === "CANCELLED" || ctx.appt.status === "COMPLETED")
    return NextResponse.json({ error: "Consultation is closed" }, { status: 409 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  const message = await db.message.create({
    data: { appointmentId: ctx.appt.id, senderId: ctx.user.id, body: parsed.data.body },
    include: { sender: { select: { name: true, role: true } } },
  });
  return NextResponse.json(message, { status: 201 });
}
