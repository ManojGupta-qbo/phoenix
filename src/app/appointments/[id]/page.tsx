import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { audit, getAppointmentFor } from "@/lib/access";
import { saveNotes, setStatus } from "@/app/actions";
import { LocalTime } from "@/components/LocalTime";
import { Chat } from "./Chat";

const VIDEO_BASE = process.env.NEXT_PUBLIC_VIDEO_BASE_URL ?? "https://meet.jit.si";

export default async function AppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const appt = await getAppointmentFor(user, id);
  if (!appt) notFound();
  await audit(user.id, "VIEW", `appointment:${appt.id}`);

  const isExpert = appt.expertId === user.expertProfile?.id;
  const closed = appt.status === "CANCELLED" || appt.status === "COMPLETED";
  const showVideo = appt.mode === "VIDEO" && appt.status === "CONFIRMED";
  const canManage = isExpert || user.role === "ADMIN";

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>{appt.mode === "ASYNC" ? "Question" : `${appt.mode === "VIDEO" ? "Video" : "Chat"} consultation`}</h1>
        <span className="badge">{appt.status}</span>
      </div>
      <p className="muted">
        {isExpert ? `Patient: ${appt.patient.name}` : `Expert: ${appt.expert.user.name} (${appt.expert.specialty})`}
        {appt.slot && <> · <LocalTime iso={appt.slot.startsAt.toISOString()} /></>}
      </p>
      <p className="card"><strong>Concern:</strong> {appt.reason}</p>

      <div className="row">
        {canManage && appt.status === "REQUESTED" && (
          <form action={setStatus.bind(null, appt.id, "CONFIRMED")}><button>Confirm</button></form>
        )}
        {canManage && appt.status === "CONFIRMED" && (
          <form action={setStatus.bind(null, appt.id, "COMPLETED")}><button>Mark completed</button></form>
        )}
        {!closed && (
          <form action={setStatus.bind(null, appt.id, "CANCELLED")}><button className="danger">Cancel</button></form>
        )}
      </div>

      <div className="two-col">
        <section className="card stack">
          {showVideo ? (
            <iframe
              className="video"
              src={`${VIDEO_BASE}/phoenix-${appt.videoRoom}#userInfo.displayName="${encodeURIComponent(user.name)}"`}
              allow="camera; microphone; fullscreen; display-capture"
              title="Video consultation"
            />
          ) : appt.mode === "VIDEO" ? (
            <p className="muted">The video room opens once the expert confirms.</p>
          ) : null}
          <h2 style={{ margin: 0 }}>Messages</h2>
          <Chat appointmentId={appt.id} meId={user.id} live={appt.mode !== "ASYNC"} closed={closed} />
        </section>
        <section className="card stack">
          <h2 style={{ margin: 0 }}>Consultation notes</h2>
          {isExpert ? (
            <form action={saveNotes.bind(null, appt.id)} className="stack">
              <textarea name="notes" rows={10} defaultValue={appt.notes ?? ""} placeholder="Findings, advice, prescriptions…" />
              <button>Save notes</button>
            </form>
          ) : (
            <p style={{ whiteSpace: "pre-wrap" }}>{appt.notes || <span className="muted">No notes yet.</span>}</p>
          )}
        </section>
      </div>
    </div>
  );
}
