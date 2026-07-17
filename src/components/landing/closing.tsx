"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  LayoutGrid,
  Stethoscope,
  Sparkles,
  ShieldCheck,
  Lock,
  Eye,
  FileHeart,
  Smartphone,
  Monitor,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

const ease = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, color }: { children: string; color: string }) {
  return (
    <span
      className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-quiet"
      style={{ color }}
    >
      {children}
    </span>
  );
}

const workspaceFeatures = [
  {
    icon: LayoutGrid,
    tone: "bg-soft-blue text-blue",
    title: "A live triage queue",
    body: "Patients sorted by urgency and wait time, not first-come — emergencies rise to the top.",
  },
  {
    icon: Sparkles,
    tone: "bg-soft-purple text-aria",
    title: "ARIA handover, reviewed",
    body: "The AI intake is a draft. The clinician accepts, edits or overrides before it counts.",
  },
  {
    icon: Stethoscope,
    tone: "bg-soft-green text-green",
    title: "Consult to care plan",
    body: "Run the call, then file notes, prescription and follow-up in one continuous flow.",
  },
];

const trustPillars = [
  { icon: Eye, title: "Every read is logged", body: "Opening a chart records who, what and why." },
  { icon: Lock, title: "Consent-gated records", body: "The patient grants access; the server enforces it." },
  { icon: ShieldCheck, title: "Immutable audit", body: "Access history can't be edited or quietly deleted." },
  { icon: FileHeart, title: "Designed for DPDP + ABDM", body: "Consent, ABHA and FHIR shaped in from day one." },
];

export function Closing() {
  return (
    <>
      {/* Workspace showcase */}
      <section id="workspace" className="relative px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <Eyebrow color="var(--blue)">The doctor workspace</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl">
              <span className="text-ink">A clinical workspace,</span>
              <br />
              <span className="text-ink-faint">not a stretched screen.</span>
            </h2>
            <p className="mt-4 text-lg text-ink-soft">
              Purpose-built for clinicians, responsive from desktop to a phone
              browser — the same care flow at every information density.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {workspaceFeatures.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="h-full rounded-[1.75rem] bg-white p-7 shadow-quiet transition-shadow hover:shadow-lift">
                  <span
                    className={`grid size-12 place-items-center rounded-full ${f.tone}`}
                  >
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-extrabold text-ink">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-5 flex flex-wrap items-center gap-4 rounded-full bg-white px-7 py-4 shadow-quiet">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
                <Monitor className="size-4 text-ink-faint" /> Desktop
                <span className="text-ink-faint">·</span>
                <Smartphone className="size-4 text-ink-faint" /> Tablet &amp;
                mobile browser
              </div>
              <Link
                href="/portal"
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:brightness-110 active:scale-[0.97]"
              >
                Open the live demo <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <Eyebrow color="var(--green)">Trust architecture</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl">
              <span className="text-ink">The client requests.</span>
              <br />
              <span className="text-ink-faint">The server decides.</span>
            </h2>
            <p className="mt-4 text-lg text-ink-soft">
              Real health data raises the engineering standard. Identity,
              consent and audit sit between every client and every record.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustPillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06}>
                <div className="h-full rounded-[1.75rem] bg-white p-6 shadow-quiet transition-shadow hover:shadow-lift">
                  <span className="grid size-11 place-items-center rounded-full bg-soft-green text-green">
                    <p.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display font-extrabold text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — black card, like the app's primary pills */}
      <section className="relative px-6 pb-24 pt-6">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-16 text-center text-white sm:px-16">
              <div className="pointer-events-none absolute -left-16 -top-16 size-72 rounded-full bg-blue/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-10 size-72 rounded-full bg-aria/25 blur-3xl" />
              <h2 className="relative font-display text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl">
                Step into today&rsquo;s queue.
              </h2>
              <p className="relative mx-auto mt-4 max-w-lg text-white/65">
                The workspace runs on realistic demo data — sign in and review a
                waiting patient from voice intake to filed care plan.
              </p>
              <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/portal"
                  className="inline-flex h-13 items-center gap-2 rounded-full bg-white px-8 text-[15px] font-semibold text-ink transition-transform hover:bg-white/90 active:scale-[0.97]"
                >
                  Enter the workspace <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-13 items-center rounded-full px-7 text-[15px] font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Doctor sign in
                </Link>
              </div>
              <p className="relative mt-7 text-xs text-white/40">
                Demo: ananya.rao@nirog.health · nirog-demo
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 rounded-full bg-white/70 px-7 py-5 backdrop-blur sm:flex-row">
          <Logo size={24} />
          <p className="text-sm text-ink-faint">
            Nirog Care Platform · A product &amp; architecture demo — not
            medical advice.
          </p>
          <div className="flex gap-5 text-sm font-semibold text-ink-soft">
            <a href="#world" className="hover:text-ink">
              Care world
            </a>
            <Link href="/portal" className="hover:text-ink">
              Workspace
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
