"use client";

import { useActionState, useState } from "react";
import { bookAppointment } from "@/app/actions";
import { LocalTime } from "@/components/LocalTime";

export function BookingForm({ expertId, slots }: { expertId: string; slots: { id: string; startsAt: string }[] }) {
  const [state, action, pending] = useActionState(bookAppointment, undefined);
  const [mode, setMode] = useState("VIDEO");
  return (
    <form action={action} className="card stack">
      <h2 style={{ margin: 0 }}>Book a consultation</h2>
      <input type="hidden" name="expertId" value={expertId} />
      <label>
        Consultation type
        <select name="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="VIDEO">Video call</option>
          <option value="CHAT">Live chat</option>
          <option value="ASYNC">Written question (reply within 24h)</option>
        </select>
      </label>
      {mode !== "ASYNC" && (
        <fieldset className="stack" style={{ border: 0, padding: 0 }}>
          <legend>Available slots</legend>
          {slots.length === 0 && <p className="muted">No open slots — try a written question.</p>}
          {slots.map((s) => (
            <label key={s.id} className="row" style={{ display: "flex" }}>
              <input type="radio" name="slotId" value={s.id} required style={{ width: "auto" }} />
              <LocalTime iso={s.startsAt} />
            </label>
          ))}
        </fieldset>
      )}
      <label>Describe your concern<textarea name="reason" rows={4} required minLength={5} /></label>
      {state?.error && <p className="error">{state.error}</p>}
      <button disabled={pending}>{pending ? "Booking…" : "Book"}</button>
    </form>
  );
}
