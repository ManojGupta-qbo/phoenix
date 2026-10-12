"use client";

import { useActionState, useState } from "react";
import { register } from "../actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined);
  const [role, setRole] = useState("PATIENT");
  return (
    <form action={action} className="card stack" style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1>Create account</h1>
      <label>
        I am a
        <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="PATIENT">Patient / customer</option>
          <option value="EXPERT">Expert / practitioner</option>
        </select>
      </label>
      <label>Full name<input name="name" required /></label>
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label>Phone<input name="phone" type="tel" /></label>
      <label>Password<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
      {role === "EXPERT" && (
        <>
          <label>Specialty<input name="specialty" placeholder="e.g. General Physician" required /></label>
          <label>Qualifications & registration no.<input name="qualifications" required /></label>
          <p className="muted">Expert accounts are listed after the clinic verifies credentials.</p>
        </>
      )}
      <label className="row" style={{ display: "flex" }}>
        <input type="checkbox" name="consent" required style={{ width: "auto" }} />
        I consent to the processing of my health data for consultations.
      </label>
      {state?.error && <p className="error">{state.error}</p>}
      <button disabled={pending}>{pending ? "Creating…" : "Create account"}</button>
    </form>
  );
}
