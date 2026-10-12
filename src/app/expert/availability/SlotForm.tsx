"use client";

import { addSlot } from "@/app/actions";

export function SlotForm() {
  return (
    <form action={addSlot} className="row">
      <input type="hidden" name="tzOffset" value={new Date().getTimezoneOffset()} suppressHydrationWarning />
      <input type="date" name="date" required style={{ width: "auto" }} />
      <input type="time" name="time" required style={{ width: "auto" }} />
      <select name="minutes" defaultValue="30" style={{ width: "auto" }}>
        <option value="15">15 min</option><option value="30">30 min</option><option value="60">60 min</option>
      </select>
      <button>Add slot</button>
    </form>
  );
}
