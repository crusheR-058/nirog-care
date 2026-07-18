"use client";

import {
  Mic,
  Radio,
  Video,
  Phone,
  MessageSquare,
  ShieldCheck,
  Globe2,
  KeyRound,
  TriangleAlert,
  Check,
  Signal,
} from "lucide-react";
import { SectionHeader, Reveal } from "@/components/landing/shared";
import { ProductWindow } from "@/components/landing/product-window";
import { cn } from "@/lib/utils";

interface Row {
  eyebrow: string;
  color: string;
  title: string;
  body: string;
  points: string[];
  visual: React.ReactNode;
}

function GlassPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-float backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}

const ROWS: Row[] = [
  {
    eyebrow: "ARIA · AI voice intake",
    color: "var(--aria)",
    title: "Patients speak. ARIA structures.",
    body: "Symptoms described out loud, in the patient's own language, become a structured clinical picture with deterministic red flags — handed to a clinician, never acting alone.",
    points: ["Hindi & regional languages", "Works on low bandwidth", "Red-flag escalation"],
    visual: (
      <GlassPanel>
        <div className="pointer-events-none absolute -right-14 -top-14 size-48 rounded-full bg-soft-purple blur-2xl" />
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-aria">
          <Mic className="size-4" /> Listening · Hindi
        </p>
        <div className="mt-5 flex h-20 items-end gap-[4px]">
          {[16, 30, 46, 24, 54, 34, 62, 38, 50, 22, 56, 32, 42, 26, 52, 20, 40, 34, 28].map((h, i) => (
            <span
              key={i}
              className="w-2.5 rounded-full bg-aria/70"
              style={{ height: h, animation: `wave 1.2s ease-in-out ${i * 0.06}s infinite` }}
            />
          ))}
        </div>
        <div className="mt-5 rounded-xl bg-canvas p-3.5">
          <p className="text-xs leading-relaxed text-ink/85">
            &ldquo;Saans phoolti hai, do din se… seene mein dabav…&rdquo;
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-soft-purple px-2 py-0.5 text-[10px] font-semibold text-aria">Breathlessness · 2d</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-soft-red px-2 py-0.5 text-[10px] font-semibold text-red">
              <TriangleAlert className="size-2.5" /> Chest pressure
            </span>
          </div>
        </div>
      </GlassPanel>
    ),
  },
  {
    eyebrow: "Doctor workspace",
    color: "var(--blue)",
    title: "A live triage queue, not a waiting list.",
    body: "Patients sorted by urgency and wait time, updating in realtime. Emergencies rise to the top; the clinician sees the whole picture before the call connects.",
    points: ["Realtime queue updates", "ARIA handover in context", "One-click consult start"],
    visual: (
      <div className="relative">
        <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-b from-white/70 to-transparent blur-xl" />
        <ProductWindow />
        <span className="absolute -right-3 -top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-green shadow-float backdrop-blur">
          <Radio className="size-3" /> Live
        </span>
      </div>
    ),
  },
  {
    eyebrow: "Teleconsultation",
    color: "var(--green)",
    title: "Consults that survive weak networks.",
    body: "Video when the network allows, audio when it doesn't, chat when it must. Consultations degrade gracefully and resume exactly where they dropped.",
    points: ["Graceful audio downgrade", "Resumable sessions", "Assisted mode for ASHA workers"],
    visual: (
      <GlassPanel className="bg-ink/95 text-white">
        <div className="grid aspect-[16/10] place-items-center rounded-xl bg-[radial-gradient(120%_100%_at_50%_0%,#2a2a30_0%,#0c0c0e_70%)]">
          <div className="flex flex-col items-center gap-2.5">
            <span className="grid size-14 place-items-center rounded-full bg-soft-red text-lg font-bold text-red">RY</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red/90 px-2.5 py-0.5 text-[10px] font-semibold">
              <span className="size-1.5 animate-pulse rounded-full bg-white" /> LIVE 04:12
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-amber">
            <Signal className="size-3" /> Fair network → audio ready
          </span>
          <div className="flex gap-2">
            {[Video, Phone, MessageSquare].map((I, i) => (
              <span key={i} className={`grid size-8 place-items-center rounded-full ${i === 0 ? "bg-green text-white" : "bg-white/10 text-white/70"}`}>
                <I className="size-3.5" />
              </span>
            ))}
          </div>
        </div>
      </GlassPanel>
    ),
  },
  {
    eyebrow: "Trust architecture",
    color: "var(--blue)",
    title: "The database enforces access.",
    body: "Row-Level Security on every table. A doctor sees only patients who've granted consent — the server decides, not the client — and every read is logged, immutably.",
    points: ["Consent-gated records", "Immutable audit trail", "Encrypted document locker"],
    visual: (
      <GlassPanel>
        <div className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-full bg-soft-blue text-blue">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Row-Level Security</p>
            <p className="text-[11px] text-ink-faint">enforced by Postgres, not the UI</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 font-mono text-[11px]">
          <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2">
            <span className="text-ink-soft">anon → SELECT Patient</span>
            <span className="font-semibold text-red">0 rows</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2">
            <span className="text-ink-soft">dr.rao → SELECT Patient</span>
            <span className="font-semibold text-green">consented only ✓</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2">
            <span className="text-ink-soft">audit → every read</span>
            <span className="font-semibold text-ink">who · what · why</span>
          </div>
        </div>
      </GlassPanel>
    ),
  },
];

const MORE = [
  { icon: Globe2, label: "Global onboarding — PAN/Aadhaar to SSN/NPI" },
  { icon: KeyRound, label: "TOTP two-factor with step-up at sign-in" },
  { icon: Check, label: "Care plans filed under the doctor's registration" },
];

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden px-6 py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-[18%] size-[360px] rounded-full bg-blue/8 blur-[100px]" />
        <div className="absolute -right-24 bottom-[12%] size-[380px] rounded-full bg-aria/8 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="One platform"
          color="var(--blue)"
          title="Every step of care, engineered."
          faintFrom={4}
          sub="From the first spoken symptom to a signed, audited care plan — a single system, not a stack of disconnected tools."
        />

        <div className="mt-20 flex flex-col gap-24">
          {ROWS.map((row, i) => {
            const flip = i % 2 === 1;
            return (
              <div
                key={row.title}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <Reveal from={flip ? "right" : "left"} className={flip ? "lg:order-2" : ""}>
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: row.color }}
                  >
                    {row.eyebrow}
                  </span>
                  <h3 className="mt-3 text-balance font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-4xl">
                    {row.title}
                  </h3>
                  <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-soft">
                    {row.body}
                  </p>
                  <ul className="mt-6 flex flex-col gap-2.5">
                    {row.points.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-ink">
                        <span className="grid size-5 place-items-center rounded-full bg-soft-green text-green">
                          <Check className="size-3" />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal from={flip ? "left" : "right"} delay={0.1} className={flip ? "lg:order-1" : ""}>
                  <div className="mx-auto w-full max-w-md">{row.visual}</div>
                </Reveal>
              </div>
            );
          })}
        </div>

        {/* remaining capabilities, quietly */}
        <Reveal className="mt-20">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {MORE.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2.5 text-[13px] font-semibold text-ink-soft shadow-quiet backdrop-blur"
              >
                <Icon className="size-4 text-blue" /> {label}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
