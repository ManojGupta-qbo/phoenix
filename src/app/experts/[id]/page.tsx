import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { BookingForm } from "./BookingForm";

export default async function ExpertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expert = await db.expertProfile.findFirst({
    where: { id, verified: true },
    include: {
      user: { select: { name: true } },
      slots: { where: { booked: false, startsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, take: 30 },
    },
  });
  if (!expert) notFound();
  const session = await getSession();

  return (
    <div className="two-col">
      <section className="card">
        <h1 style={{ marginTop: 0 }}>{expert.user.name}</h1>
        <p><strong>{expert.specialty}</strong></p>
        <p className="muted">{expert.qualifications}</p>
        <p>{expert.bio || "No bio yet."}</p>
        <p>Consultation fee: {(expert.feeCents / 100).toFixed(2)}</p>
      </section>
      {session?.role === "PATIENT" ? (
        <BookingForm expertId={expert.id} slots={expert.slots.map((s) => ({ id: s.id, startsAt: s.startsAt.toISOString() }))} />
      ) : (
        <div className="card">
          {session ? <p>Only patient accounts can book.</p> : <p><Link href="/login">Log in</Link> as a patient to book.</p>}
        </div>
      )}
    </div>
  );
}
