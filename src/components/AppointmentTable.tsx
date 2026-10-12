import Link from "next/link";
import { LocalTime } from "./LocalTime";

export type Row = { id: string; who: string; mode: string; status: string; startsAt: Date | null; createdAt: Date };

export function AppointmentTable({ rows, whoLabel }: { rows: Row[]; whoLabel: string }) {
  if (rows.length === 0) return <p className="muted">No consultations yet.</p>;
  return (
    <table>
      <thead><tr><th>{whoLabel}</th><th>Type</th><th>When</th><th>Status</th><th /></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.who}</td>
            <td>{r.mode}</td>
            <td>{r.startsAt ? <LocalTime iso={r.startsAt.toISOString()} /> : <span className="muted">Async</span>}</td>
            <td><span className="badge">{r.status}</span></td>
            <td><Link href={`/appointments/${r.id}`}>Open</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
