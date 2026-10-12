import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { setExpertVerified } from "@/app/actions";
import { LocalTime } from "@/components/LocalTime";

export default async function AdminPage() {
  await requireUser(["ADMIN"]);
  const [experts, counts, logs] = await Promise.all([
    db.expertProfile.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { verified: "asc" } }),
    db.appointment.groupBy({ by: ["status"], _count: true }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 25, include: { user: { select: { email: true } } } }),
  ]);

  return (
    <div className="stack">
      <h1>Clinic admin</h1>
      <div className="grid">
        {counts.map((c) => (
          <div key={c.status} className="card"><div className="muted">{c.status}</div><strong style={{ fontSize: "1.6rem" }}>{c._count}</strong></div>
        ))}
      </div>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Experts</h2>
        <table>
          <thead><tr><th>Name</th><th>Specialty</th><th>Qualifications</th><th>Status</th><th /></tr></thead>
          <tbody>
            {experts.map((e) => (
              <tr key={e.id}>
                <td>{e.user.name}<br /><small className="muted">{e.user.email}</small></td>
                <td>{e.specialty}</td>
                <td>{e.qualifications}</td>
                <td><span className="badge">{e.verified ? "Verified" : "Pending"}</span></td>
                <td>
                  <form action={setExpertVerified.bind(null, e.id, !e.verified)}>
                    <button className={e.verified ? "secondary" : ""}>{e.verified ? "Revoke" : "Verify"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Recent audit log</h2>
        <table>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}><td><LocalTime iso={l.createdAt.toISOString()} /></td><td>{l.user?.email ?? "—"}</td><td>{l.action}</td><td>{l.target}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
