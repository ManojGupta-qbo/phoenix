import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { AppointmentTable } from "@/components/AppointmentTable";

export default async function Dashboard() {
  const user = await requireUser();
  const isExpert = user.role === "EXPERT";

  const where =
    user.role === "ADMIN" ? {} : isExpert ? { expertId: user.expertProfile?.id ?? "-" } : { patientId: user.id };
  const appts = await db.appointment.findMany({
    where,
    include: { slot: true, patient: { select: { name: true } }, expert: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const rows = appts.map((a) => ({
    id: a.id,
    who: isExpert ? a.patient.name : a.expert.user.name,
    mode: a.mode,
    status: a.status,
    startsAt: a.slot?.startsAt ?? null,
    createdAt: a.createdAt,
  }));

  return (
    <div className="stack">
      <h1>Welcome, {user.name}</h1>
      {isExpert && !user.expertProfile?.verified && (
        <p className="card">Your profile is pending verification by the clinic. Meanwhile, set up your <Link href="/expert/availability">availability</Link>.</p>
      )}
      {user.role === "PATIENT" && <p><Link href="/experts" className="btn">Book a new consultation</Link></p>}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>{isExpert ? "Your patients" : "Your consultations"}</h2>
        <AppointmentTable rows={rows} whoLabel={isExpert ? "Patient" : "Expert"} />
      </section>
    </div>
  );
}
