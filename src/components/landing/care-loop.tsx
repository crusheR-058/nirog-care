"use client";

import { motion } from "motion/react";
import {
  Mic,
  Stethoscope,
  Video,
  ClipboardCheck,
  Pill,
  BellRing,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  { icon: Mic, tone: "text-aria bg-soft-purple", title: "Intake", desc: "ARIA listens, by voice" },
  { icon: Stethoscope, tone: "text-blue bg-soft-blue", title: "Review", desc: "Doctor sees red flags" },
  { icon: Video, tone: "text-green bg-soft-green", title: "Consult", desc: "Audio · video · chat" },
  { icon: ClipboardCheck, tone: "text-amber bg-soft-amber", title: "Care plan", desc: "Notes + prescription" },
  { icon: Pill, tone: "text-indigo bg-soft-indigo", title: "Fulfil", desc: "Medicines & tests" },
  { icon: BellRing, tone: "text-red bg-soft-red", title: "Follow-up", desc: "Reminders return" },
];

const CAPABILITIES = [
  "Voice-first intake", "Realtime triage", "Consent-gated records", "Row-Level Security",
  "TOTP 2FA", "Google sign-in", "Teleconsult", "E-prescriptions", "Global onboarding",
  "Immutable audit", "ABDM aligned", "DPDP aligned", "Supabase-native", "Document locker",
];

export function CareLoop() {
  return (
    <section className="relative overflow-hidden py-20">
      {/* marquee */}
      <div className="relative flex overflow-hidden border-y border-hairline bg-white/50 py-4 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="marquee-track gap-3">
          {[...CAPABILITIES, ...CAPABILITIES].map((c, i) => (
            <span
              key={i}
              className="whitespace-nowrap rounded-full border border-hairline bg-panel px-4 py-1.5 text-sm font-medium text-ink-soft"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-green shadow-quiet">
            The care loop
          </span>
          <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl">
            <span className="text-ink">Every interaction,</span>{" "}
            <span className="text-ink-faint">one episode.</span>
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            The north-star isn&rsquo;t logins or AI messages — it&rsquo;s resolved
            care episodes that close the loop and come back as follow-up.
          </p>
        </motion.div>

        {/* flow */}
        <div className="relative mt-14">
          <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-aria/40 via-green/40 to-red/40 md:block" />
          <div className="grid grid-cols-2 gap-y-8 md:grid-cols-6 md:gap-0">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, ease, delay: i * 0.08 }}
                  className="relative flex flex-col items-center px-2 text-center"
                >
                  <span className={`relative z-10 grid size-14 place-items-center rounded-2xl ring-4 ring-canvas ${s.tone}`}>
                    <Icon className="size-6" />
                  </span>
                  <span className="mt-2 text-[11px] font-bold text-ink-faint">
                    0{i + 1}
                  </span>
                  <p className="mt-1 font-display font-extrabold text-ink">{s.title}</p>
                  <p className="text-xs text-ink-soft">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
