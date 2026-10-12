import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { logout } from "./actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phoenix Clinic",
  description: "Book in-clinic visits and online consultations with verified experts.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <Link href="/" className="brand">Phoenix Clinic</Link>
          <nav>
            <Link href="/experts">Find an expert</Link>
            {session ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                {session.role === "EXPERT" && <Link href="/expert/availability">Availability</Link>}
                {session.role === "ADMIN" && <Link href="/admin">Admin</Link>}
                <form action={logout}><button className="link">Log out</button></form>
              </>
            ) : (
              <>
                <Link href="/login">Log in</Link>
                <Link href="/register" className="btn">Register</Link>
              </>
            )}
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          Not for emergencies — call your local emergency number. Your data is handled under our privacy policy.
        </footer>
      </body>
    </html>
  );
}
