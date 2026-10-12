"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { id: string; body: string; createdAt: string; senderId: string; sender: { name: string } };

export function Chat({ appointmentId, meId, live, closed }: { appointmentId: string; meId: string; live: boolean; closed: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    let stop = false;
    async function poll() {
      const qs = lastRef.current ? `?after=${encodeURIComponent(lastRef.current)}` : "";
      const res = await fetch(`/api/appointments/${appointmentId}/messages${qs}`);
      if (!res.ok || stop) return;
      const fresh: Msg[] = await res.json();
      if (fresh.length) {
        lastRef.current = fresh[fresh.length - 1].createdAt;
        setMessages((m) => [...m, ...fresh.filter((f) => !m.some((x) => x.id === f.id))]);
      }
    }
    poll();
    // Live sessions poll fast; async threads refresh slowly. Swap for WebSockets/SSE at scale.
    const t = setInterval(poll, live ? 2500 : 15000);
    return () => { stop = true; clearInterval(t); };
  }, [appointmentId, live]);

  useEffect(() => { boxRef.current?.scrollTo(0, boxRef.current.scrollHeight); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    const res = await fetch(`/api/appointments/${appointmentId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (!res.ok) return setError((await res.json()).error ?? "Failed to send");
    const msg: Msg = await res.json();
    lastRef.current = msg.createdAt;
    setMessages((m) => [...m, msg]);
    setText("");
  }

  return (
    <div className="stack">
      <div className="chat" ref={boxRef}>
        {messages.length === 0 && <p className="muted">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.senderId === meId ? "mine" : ""}`}>
            <small>{m.sender.name}</small>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
          </div>
        ))}
      </div>
      {!closed && (
        <form onSubmit={send} className="row">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" style={{ flex: 1 }} maxLength={4000} />
          <button>Send</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
