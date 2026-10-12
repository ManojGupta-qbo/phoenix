import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { deleteSlot, updateProfile } from "@/app/actions";
import { LocalTime } from "@/components/LocalTime";
import { SlotForm } from "./SlotForm";

export default async function AvailabilityPage() {
  const user = await requireUser(["EXPERT"]);
  const profile = user.expertProfile!;
  const slots = await db.slot.findMany({
    where: { expertId: profile.id, startsAt: { gt: new Date() } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="stack">
      <h1>Profile & availability</h1>
      <form action={updateProfile} className="card stack">
        <label>Specialty<input name="specialty" defaultValue={profile.specialty} /></label>
        <label>Bio<textarea name="bio" rows={3} defaultValue={profile.bio} /></label>
        <label>Fee<input name="fee" type="number" min="0" step="0.01" defaultValue={(profile.feeCents / 100).toFixed(2)} /></label>
        <button>Save profile</button>
      </form>
      <section className="card stack">
        <h2 style={{ margin: 0 }}>Upcoming slots</h2>
        <SlotForm />
        <table>
          <tbody>
            {slots.map((s) => (
              <tr key={s.id}>
                <td><LocalTime iso={s.startsAt.toISOString()} /></td>
                <td>{(s.endsAt.getTime() - s.startsAt.getTime()) / 60000} min</td>
                <td>{s.booked ? <span className="badge">Booked</span> : (
                  <form action={deleteSlot.bind(null, s.id)}><button className="link">Remove</button></form>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {slots.length === 0 && <p className="muted">No upcoming slots.</p>}
      </section>
    </div>
  );
}
