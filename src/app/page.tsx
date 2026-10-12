import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Care at the clinic or from your desk</h1>
        <p className="muted">
          Book a visit, or consult a verified expert online by video, live chat, or a written question.
        </p>
        <div className="row">
          <Link href="/experts" className="btn">Find an expert</Link>
          <Link href="/register" className="btn secondary">Create account</Link>
        </div>
      </section>
      <section className="grid">
        <div className="card"><h3>Video consultation</h3><p className="muted">Face-to-face call at a booked time, with chat alongside.</p></div>
        <div className="card"><h3>Live chat</h3><p className="muted">Real-time text session — handy from the office.</p></div>
        <div className="card"><h3>Ask a question</h3><p className="muted">Send your concern anytime; the expert replies in a private thread.</p></div>
      </section>
    </>
  );
}
