import "server-only";
import { db } from "./db";
import type { CurrentUser } from "./session";

/** Loads an appointment only if the user is its patient, its expert, or an admin. */
export async function getAppointmentFor(user: CurrentUser, appointmentId: string) {
  const appt = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true, expert: { include: { user: true } }, slot: true },
  });
  if (!appt) return null;
  const allowed =
    user.role === "ADMIN" || appt.patientId === user.id || appt.expertId === user.expertProfile?.id;
  return allowed ? appt : null;
}

export async function audit(userId: string | null, action: string, target: string) {
  await db.auditLog.create({ data: { userId, action, target } });
}
