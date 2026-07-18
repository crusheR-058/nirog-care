"use client";

import { motion } from "motion/react";
import {
  Mic,
  Radio,
  Video,
  ShieldCheck,
  Globe2,
  KeyRound,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

function Card({
  className,
  delay = 0,
  from = "up",
  children,
}: {
  className?: string;
  delay?: number;
  from?: "up" | "left" | "right";
  children: React.ReactNode;
}) {
  const offset =
    from === "left" ? { x: -56, y: 0 } : from === "right" ? { x: 56, y: 0 } : { x: 0, y: 34 };
  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, ease, delay }}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 22 } }}
      className={cn(
        "group relative overflow-hidden rounded-[1.75rem] bg-white p-6 shadow-quiet transition-shadow hover:shadow-lift",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

function IconBadge({
  tone,
  children,
}: {
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`grid size-11 place-items-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${tone}`}
    >
      {children}
    </span>
  );
}

export function Bento() {
  return (
    <section id="workspace" className="relative overflow-hidden px-6 py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-blob left-[4%] top-[16%] size-[340px] bg-blue/12" />
        <div className="aurora-blob right-[6%] bottom-[8%] size-[380px] bg-aria/12" style={{ animationDelay: "-11s" }} />
      </div>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue shadow-quiet">
            One platform
          </span>
          <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl">
            <span className="text-ink">Every step of care,</span>{" "}
            <span className="text-ink-faint">engineered.</span>
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            From the first spoken symptom to a signed, audited care plan — a
            single system, not a stack of disconnected tools.
          </p>
        </motion.div>

        <div className="mt-12 grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Featured — ARIA (spans 2 cols) */}
          <Card className="sm:col-span-2 lg:row-span-2" delay={0} from="left">
            <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-soft-purple blur-2xl" />
            <IconBadge tone="bg-soft-purple text-aria">
              <Mic className="size-5" />
            </IconBadge>
            <h3 className="mt-5 font-display text-2xl font-extrabold text-ink">
              ARIA — voice-first AI intake
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
              Patients describe symptoms out loud, in their own language. ARIA
              turns it into a structured clinical picture with deterministic red
              flags — handed to a clinician, never acting alone.
            </p>
            {/* waveform */}
            <div className="mt-6 flex h-16 items-end gap-[3px]">
              {[14, 26, 40, 22, 48, 30, 56, 34, 44, 20, 50, 28, 38, 24, 46, 18, 36, 30].map(
                (h, i) => (
                  <span
                    key={i}
                    className="w-2 rounded-full bg-aria/70"
                    style={{ height: h, animation: `wave 1.2s ease-in-out ${i * 0.06}s infinite` }}
                  />
                )
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Hindi & regional", "Low-bandwidth", "Red-flag escalation"].map((t) => (
                <span key={t} className="rounded-full bg-soft-purple px-3 py-1 text-xs font-semibold text-aria">
                  {t}
                </span>
              ))}
            </div>
          </Card>

          {/* Realtime queue */}
          <Card delay={0.06} from="right">
            <IconBadge tone="bg-soft-green text-green">
              <Radio className="size-5" />
            </IconBadge>
            <h3 className="mt-5 font-display text-lg font-extrabold text-ink">
              Live triage queue
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Patients sorted by urgency, updating in realtime. Emergencies rise;
              no one waits unseen.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-soft-red/60 p-2">
              <span className="h-6 w-1 rounded-full bg-red" />
              <span className="text-xs font-semibold text-ink">Rahul Y.</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-red">
                <TriangleAlert className="size-3" /> Now
              </span>
            </div>
          </Card>

          {/* Consult */}
          <Card delay={0.12} from="right">
            <IconBadge tone="bg-soft-blue text-blue">
              <Video className="size-5" />
            </IconBadge>
            <h3 className="mt-5 font-display text-lg font-extrabold text-ink">
              Consult, gracefully
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Video when the network allows, audio when it doesn&rsquo;t, chat
              when it must — and it resumes where it dropped.
            </p>
          </Card>

          {/* Security (spans 2) */}
          <Card className="sm:col-span-2" delay={0.06} from="left">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-sm">
                <IconBadge tone="bg-soft-blue text-blue">
                  <ShieldCheck className="size-5" />
                </IconBadge>
                <h3 className="mt-5 font-display text-xl font-extrabold text-ink">
                  The database enforces access
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Row-Level Security on every table. A doctor sees only patients
                  who&rsquo;ve granted consent — the server decides, not the
                  client. Every read is logged.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-2xl bg-canvas p-3">
                {["Consent-gated", "Immutable audit", "Encrypted docs"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-2 text-xs font-semibold text-ink">
                    <ShieldCheck className="size-3.5 text-green" /> {t}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Global */}
          <Card delay={0.12} from="right">
            <IconBadge tone="bg-soft-amber text-amber">
              <Globe2 className="size-5" />
            </IconBadge>
            <h3 className="mt-5 font-display text-lg font-extrabold text-ink">
              Built to go global
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Onboarding adapts per country — PAN/Aadhaar in India, SSN/NPI in the
              US, SWIFT/IBAN worldwide.
            </p>
          </Card>

          {/* MFA */}
          <Card delay={0.18} from="left">
            <IconBadge tone="bg-soft-indigo text-indigo">
              <KeyRound className="size-5" />
            </IconBadge>
            <h3 className="mt-5 font-display text-lg font-extrabold text-ink">
              Verified clinicians
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Google sign-in, TOTP 2FA with step-up, and HPR-style verification
              before any patient is seen.
            </p>
          </Card>

          {/* small accent */}
          <Card delay={0.24} from="right" className="bg-ink text-white">
            <IconBadge tone="bg-white/10 text-lblue">
              <Sparkles className="size-5" />
            </IconBadge>
            <h3 className="mt-5 font-display text-lg font-extrabold">
              One connected episode
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/65">
              Not logins or AI messages — resolved care, stitched end to end.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
