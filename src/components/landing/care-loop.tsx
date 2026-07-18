"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { WordReveal } from "@/components/landing/word-reveal";
import {
  Mic,
  Stethoscope,
  Video,
  Phone,
  MessageSquare,
  ClipboardCheck,
  Pill,
  BellRing,
  TriangleAlert,
  CheckCircle2,
  ArrowRight,
  CalendarClock,
  Truck,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

interface Step {
  icon: typeof Mic;
  tone: string;
  bar: string;
  title: string;
  desc: string;
  visual: React.ReactNode;
}

const STEPS: Step[] = [
  {
    icon: Mic,
    tone: "text-aria bg-soft-purple",
    bar: "var(--aria)",
    title: "Intake",
    desc: "ARIA listens in the patient's own language and structures the story — no forms, no typing.",
    visual: (
      <div className="flex h-10 items-end gap-[3px]">
        {[10, 18, 26, 14, 32, 20, 36, 22, 28, 12, 30, 16, 24].map((h, i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-aria/70"
            style={{ height: h, animation: `wave 1.2s ease-in-out ${i * 0.07}s infinite` }}
          />
        ))}
        <span className="ml-2 self-center rounded-md bg-soft-purple px-2 py-0.5 text-[10px] font-semibold text-aria">
          Hindi · live
        </span>
      </div>
    ),
  },
  {
    icon: Stethoscope,
    tone: "text-blue bg-soft-blue",
    bar: "var(--blue)",
    title: "Review",
    desc: "The doctor sees the summary, vitals and deterministic red flags before the call connects.",
    visual: (
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-soft-red px-2 py-1 text-[10px] font-semibold text-red">
          <TriangleAlert className="size-3" /> Chest pressure
        </span>
        <span className="rounded-md bg-soft-purple px-2 py-1 text-[10px] font-semibold text-aria">
          SpO₂ 93%
        </span>
        <span className="rounded-md bg-soft-blue px-2 py-1 text-[10px] font-semibold text-blue">
          Pulse 104
        </span>
      </div>
    ),
  },
  {
    icon: Video,
    tone: "text-green bg-soft-green",
    bar: "var(--green)",
    title: "Consult",
    desc: "Video when the network allows, audio when it doesn't, chat when it must — and it resumes.",
    visual: (
      <div className="flex gap-2">
        {[Video, Phone, MessageSquare].map((I, i) => (
          <span
            key={i}
            className={`grid size-9 place-items-center rounded-full ${i === 0 ? "bg-green text-white" : "bg-soft-green text-green"}`}
          >
            <I className="size-4" />
          </span>
        ))}
        <span className="self-center rounded-md bg-soft-green px-2 py-0.5 text-[10px] font-semibold text-green">
          resumable
        </span>
      </div>
    ),
  },
  {
    icon: ClipboardCheck,
    tone: "text-amber bg-soft-amber",
    bar: "var(--amber)",
    title: "Care plan",
    desc: "Notes, prescription and tests — filed under the doctor's registration, fully audited.",
    visual: (
      <div className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2">
        <Pill className="size-4 text-blue" />
        <span className="text-xs font-semibold text-ink">Amlodipine 5mg · OD</span>
        <CheckCircle2 className="ml-auto size-4 text-green" />
      </div>
    ),
  },
  {
    icon: Truck,
    tone: "text-indigo bg-soft-indigo",
    bar: "var(--indigo)",
    title: "Fulfil",
    desc: "Medicines and tests reach the village — 2-day rural delivery, tracked in the patient app.",
    visual: (
      <div className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2">
        <span className="grid size-6 place-items-center rounded-full bg-soft-green text-green">
          <CheckCircle2 className="size-3.5" />
        </span>
        <span className="text-xs font-semibold text-ink">Order placed · ₹86</span>
        <span className="ml-auto flex gap-1">
          <span className="size-1.5 rounded-full bg-green" />
          <span className="size-1.5 rounded-full bg-green/50" />
          <span className="size-1.5 rounded-full bg-ink/15" />
        </span>
      </div>
    ),
  },
  {
    icon: BellRing,
    tone: "text-red bg-soft-red",
    bar: "var(--red)",
    title: "Follow-up",
    desc: "The plan returns as reminders — the loop closes, and care becomes continuous.",
    visual: (
      <div className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2">
        <CalendarClock className="size-4 text-amber" />
        <span className="text-xs font-semibold text-ink">Review in 7 days</span>
        <span className="ml-auto rounded-md bg-soft-amber px-2 py-0.5 text-[10px] font-semibold text-amber">
          reminder set
        </span>
      </div>
    ),
  },
];

function StepCard({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;
  return (
    <div className="relative flex w-[76vw] max-w-[360px] shrink-0 flex-col overflow-hidden rounded-[1.75rem] bg-white p-5 shadow-quiet transition-shadow hover:shadow-lift sm:w-[360px] sm:p-7">
      {/* accent top bar + ghost number */}
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: step.bar }} />
      <span className="ghost-number pointer-events-none absolute -right-2 -top-4 text-[7.5rem]">
        0{index + 1}
      </span>

      <span className={`grid size-14 place-items-center rounded-2xl ${step.tone}`}>
        <Icon className="size-6" />
      </span>
      <h3 className="mt-5 font-display text-2xl font-extrabold text-ink">
        {step.title}
      </h3>
      <p className="mt-2 min-h-16 text-sm leading-relaxed text-ink-soft">
        {step.desc}
      </p>
      <div className="mt-auto pt-4">{step.visual}</div>
    </div>
  );
}

/**
 * Pinned horizontal journey: the section pins on screen and vertical scroll
 * drives the row of steps right → left, revealing each stage from the right.
 */
export function CareLoop() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (!trackRef.current || !viewportRef.current) return;
      setShift(
        Math.max(0, trackRef.current.scrollWidth - viewportRef.current.clientWidth)
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 100, damping: 27, restDelta: 0.001 });
  const x = useTransform(p, [0.06, 0.94], [0, -shift]);
  const lineScale = useTransform(p, [0.06, 0.94], [0, 1]);

  return (
    <section id="care-journey" ref={sectionRef} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-dvh flex-col justify-center overflow-hidden">
        {/* ambient depth (static — animated blur layers artifact inside sticky) */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 top-[10%] size-[340px] rounded-full bg-aria/10 blur-[90px]" />
          <div className="absolute -right-24 bottom-[6%] size-[380px] rounded-full bg-green/10 blur-[90px]" />
        </div>

        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mx-auto max-w-2xl px-6 text-center"
        >
          <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-green shadow-quiet">
            The care loop
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl">
            <WordReveal text="Every interaction, one episode." faintFrom={2} />
          </h2>
        </motion.div>

        {/* horizontal track — driven by vertical scroll */}
        <div ref={viewportRef} className="relative mt-10 w-full overflow-hidden">
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex w-max items-stretch gap-4 pl-6 pr-[14vw] lg:pl-[max(1.5rem,calc((100vw-72rem)/2))]"
          >
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex items-center gap-4">
                <StepCard step={s} index={i} />
                {i < STEPS.length - 1 && (
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/80 text-ink-faint shadow-quiet backdrop-blur">
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        </div>

        {/* progress + hint */}
        <div className="mx-auto mt-10 flex flex-col items-center gap-2 px-6">
          <div className="h-1.5 w-44 overflow-hidden rounded-full bg-white/70 shadow-quiet">
            <motion.div
              className="h-full w-full origin-left rounded-full bg-gradient-to-r from-aria via-green to-red"
              style={{ scaleX: lineScale }}
            />
          </div>
          <p className="text-xs font-semibold text-ink-faint">
            Keep scrolling — the loop unfolds →
          </p>
        </div>
      </div>
    </section>
  );
}
