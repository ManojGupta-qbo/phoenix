"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="card stack" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Log in</h1>
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
      {state?.error && <p className="error">{state.error}</p>}
      <button disabled={pending}>{pending ? "Signing in…" : "Log in"}</button>
      <p className="muted">New here? <Link href="/register">Create an account</Link></p>
    </form>
  );
}
