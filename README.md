# Nirog — Doctor Web Portal

The **doctor-facing web application** for the Nirog Care Platform — a continuous
telehealth platform for rural India. It pairs with the existing patient mobile
app (Expo) and gives clinicians a responsive workspace to review AI intake, run
consultations, and file care plans.

Built from the platform pitch (`output/pdf/Nirog_Care_Platform_Team_Pitch.pdf`):
identity, consent-driven records, ARIA (AI intake) handover, and a safe path to
real teleconsultation.

## The care loop

```
ARIA intake → Doctor review → Consult → Care plan → Fulfilment → Follow-up
   (voice)      (red flags)   (a/v/chat)  (Rx+notes)  (meds/tests)  (reminders)
```

The north-star metric is **resolved care episodes** — not logins or AI messages.

## Tech stack

| Layer      | Choice |
|------------|--------|
| Framework  | **Next.js 16** (App Router, RSC, Server Actions, Turbopack) |
| Language   | **TypeScript** (strict) |
| Styling    | **Tailwind CSS v4** + a bespoke "Quiet Glass" design system (`src/app/globals.css`) |
| UI         | Hand-built shadcn-style primitives (`src/components/ui`) + `lucide-react` |
| Motion     | **Motion** (Framer Motion) — scroll-scrubbed landing |
| Auth       | **Supabase Auth** (`@supabase/ssr`, cookie sessions) — doctor sign-in, JWT identity |
| Validation | **Zod** |
| Data       | Swappable source: authenticated **Supabase** (RLS-enforced, default) ⇄ in-memory **mock** ⇄ Prisma |
| Security   | **Row-Level Security** on every table + **Storage** bucket, gated by a consent function |

### One shared API contract, three backends

The portal never touches a database directly — it calls `NirogDataSource`
(`src/lib/data/source.ts`). Three implementations satisfy it:

- `supabase-source.ts` — **authenticated** Supabase client; every query runs as
  the signed-in doctor so **RLS enforces access in the database** (**default**).
- `mock-source.ts` — realistic in-memory data, zero setup.
- `prisma-source.ts` — Postgres via Prisma (service role).

Toggle with `NIROG_DATA_SOURCE=supabase | mock | db`.

### Security model (Supabase-native)

- **Auth**: doctors sign in via Supabase Auth; `Doctor.authUserId` links the
  profile to `auth.users`. Middleware refreshes the session and guards `/portal`.
- **RLS**: enabled on every table. A `current_doctor_id()` function maps
  `auth.uid()` → the doctor, and `patient_accessible()` gates patient data by
  **active consent or queue membership**. The anon/public API returns nothing.
  Policies live in `supabase/policies.sql`.
- **Storage**: private `patient-documents` bucket, files at
  `<patientId>/<file>`, with `storage.objects` policies using the same consent
  function. Uploads/downloads use short-lived signed URLs.
- Prisma manages the **schema** (`db push`) and **seeding** (service role, which
  bypasses RLS). The seed also provisions the demo doctor's Supabase Auth user.

## Quick start (mock data — no database)

```bash
pnpm install
# an .env is already provided for the demo; otherwise: cp .env.example .env
pnpm dev                  # http://localhost:3000
```

Open `http://localhost:3000` for the scroll-world landing, then **Enter workspace**.

**Demo doctor:** `ananya.rao@nirog.health` · `nirog-demo`

## Backend: Supabase (live)

This project is connected to a **Supabase** Postgres project (`nirog-care`,
region `ap-south-1` / Mumbai). `.env` holds the pooled `DATABASE_URL` (app,
port 6543) and the session `DIRECT_URL` (migrations, port 5432), and
`NIROG_DATA_SOURCE=db`. Nothing in the UI changed — the same `NirogDataSource`
contract now resolves to `prisma-source.ts` against Supabase.

Useful commands:

```bash
pnpm prisma db push   # sync schema.prisma → Supabase
pnpm db:seed          # (re)load Dr. Rao, patients, ARIA handovers, queue
pnpm db:studio        # browse the live data in Prisma Studio
```

To run fully offline instead, set `NIROG_DATA_SOURCE=mock` (no DB needed), or
point `DATABASE_URL`/`DIRECT_URL` at local Postgres via `pnpm db:up` (docker).
The seed hashes the demo password with bcrypt, so login works identically in
every mode.

## What's inside

```
src/
  app/
    page.tsx                     Scroll-world landing (hero → care world → workspace → trust)
    (auth)/login/                Doctor sign-in (split brand panel + credentials form)
    portal/
      layout.tsx                 Dark icon rail + topbar + mobile tab bar
      page.tsx                   Today — stats, live triage queue, ARIA spotlight, trust log
      patients/                  Consent-scoped patient list + full chart
      consult/[queueId]/         Consultation: mock a/v stage + care-plan capture
      audit/                     Immutable trust log (who / what / why)
      settings/                  Verified identity, security, languages, data source
      actions.ts                 Server actions: accept handover, file encounter (Zod-validated)
  components/
    landing/                     Scroll-scrubbed journey + dioramas built from real UI
    portal/                      Queue, ARIA handover, clinical vocabulary, consult
    ui/                          Quiet Glass primitives (button, card, badge, avatar, input)
    brand/                       Logo / diagnostic mark
  lib/
    domain/                      Shared types + clinical labels (the contract)
    data/                        source.ts + mock-source.ts + prisma-source.ts + seed.ts
  auth.ts, auth.config.ts        NextAuth v5 (split for edge-safe middleware)
prisma/schema.prisma             Identity, care relationships, consent, audit, clinical
```

## Design system — "Quiet Glass"

Apple/iOS-derived clinical palette from the pitch: calm canvas, white panels,
hairline borders, blue primary, **purple for ARIA**, and semantic triage colours
(red / amber / green). Full light + dark themes (dark supports night-shift
clinicians). Clinical figures use tabular numerals.

## The scroll-world landing

The landing is a scroll-scrubbed "fly through the care world" — a continuous
camera dive through five dioramas (Intake → Triage → Consult → Care plan →
Continuity), each built from the real product UI so the world is made of the
same material as the workspace.

> **Note on Higgsfield video:** the `scroll-world` skill can replace the designed
> dioramas with AI-generated cinematic video clips (Higgsfield). That path needs
> Higgsfield credits, which weren't available at build time, so this ships the
> credit-free designed version. The section structure in
> `src/components/landing/scroll-journey.tsx` is ready to accept video clips per
> scene when credits are added.

## Safety & scope

This is a **product/architecture demo on simulated data**. Real clinical
deployment requires the pitch's non-negotiables (step-up auth for prescribing,
encrypted documents, break-glass audit, DPDP + ABDM review) and specialist legal
and medical sign-off. ARIA output is always shown as **unverified** until a
clinician accepts it.
