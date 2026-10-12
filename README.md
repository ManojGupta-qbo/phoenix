# Phoenix Clinic

Database-backed clinic website: patients book in-office or online consultations with verified experts.

## Stack
- Next.js 16 (App Router, server actions) · TypeScript
- PostgreSQL + Prisma 6
- Cookie session (signed JWT via `jose`), `bcryptjs` passwords
- Video: embedded Jitsi room per appointment (`NEXT_PUBLIC_VIDEO_BASE_URL`)

## Features
| Role | Can do |
|---|---|
| Patient | Register (with data-processing consent), search experts, book **Video / Live chat / Async question**, chat, view notes, cancel |
| Expert | Profile & fee, manage time slots, confirm/complete consultations, video + chat, write clinical notes |
| Admin | Verify/revoke experts, appointment stats, audit log |

- Slot booking is atomic (no double booking).
- Every appointment is visible only to its patient, its expert, and admins (pages + API).
- Patient-data access is written to `AuditLog`.

## Run locally
```bash
cp .env.example .env          # set DATABASE_URL and SESSION_SECRET (32+ chars)
npm install
npm run db:migrate            # creates tables
npm run db:seed               # demo users, password: password123
npm run dev
```
Demo logins: `patient@`, `dr.rao@`, `dr.lee@`, `admin@phoenix.test`.

## Before production (medical data)
- Replace public `meet.jit.si` with a provider that signs a BAA/DPA (self-hosted Jitsi, Daily, Twilio).
- Encrypt notes/messages at rest; host DB in a compliant region (HIPAA / GDPR / India DPDP).
- Add email verification, password reset, rate limiting, MFA for experts/admins.
- Replace chat polling with WebSockets/SSE at scale; add payments and reminders.
