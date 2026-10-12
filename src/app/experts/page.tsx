import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ExpertsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const experts = await db.expertProfile.findMany({
    where: {
      verified: true,
      ...(q ? { OR: [{ specialty: { contains: q, mode: "insensitive" } }, { user: { name: { contains: q, mode: "insensitive" } } }] } : {}),
    },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return (
    <div className="stack">
      <h1>Our experts</h1>
      <form className="row">
        <input name="q" defaultValue={q} placeholder="Search by name or specialty" style={{ maxWidth: 320 }} />
        <button>Search</button>
      </form>
      <div className="grid">
        {experts.map((e) => (
          <Link key={e.id} href={`/experts/${e.id}`} className="card">
            <h3 style={{ margin: 0 }}>{e.user.name}</h3>
            <p className="muted" style={{ margin: "4px 0" }}>{e.specialty}</p>
            <span className="badge">Fee: {(e.feeCents / 100).toFixed(2)}</span>
          </Link>
        ))}
        {experts.length === 0 && <p className="muted">No experts found.</p>}
      </div>
    </div>
  );
}
