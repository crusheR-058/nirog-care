"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
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
  CalendarClock,
  Truck,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

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

/** One branch of the tree: node on the trunk, branch line, then the card. */
function TreeStep({ step, index }: { step: Step; index: number }) {
  const left = index % 2 === 0; // desktop: cards alternate sides of the trunk
  const Icon = step.icon;

  return (
    <div className="relative grid grid-cols-[44px_minmax(0,1fr)] items-start sm:grid-cols-2">
      {/* node — pops onto the trunk as it reaches this step */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: "0px 0px -110px 0px" }}
        transition={{ type: "spring", stiffness: 320, damping: 20 }}
        className="absolute left-[22px] top-7 z-10 -translate-x-1/2 sm:left-1/2"
      >
        <span className={cn("grid size-11 place-items-center rounded-full shadow-quiet ring-4 ring-canvas", step.tone)}>
          <Icon className="size-5" />
        </span>
        <span
          className="absolute -right-1 -top-1 grid size-4.5 place-items-center rounded-full text-[9px] font-bold text-white"
          style={{ background: step.bar }}
        >
          {index + 1}
        </span>
      </motion.div>

      {/* branch line — draws outward from the trunk toward the card (desktop) */}
      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "0px 0px -110px 0px" }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
        className={cn(
          "absolute top-[49px] hidden h-[2px] w-12 sm:block",
          left ? "right-1/2 mr-6 origin-right" : "left-1/2 ml-6 origin-left"
        )}
        style={{ background: step.bar, opacity: 0.5 }}
      />

      {/* card — grows in from its branch side */}
      <motion.div
        initial={{ opacity: 0, x: left ? -40 : 40, y: 18 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -90px 0px" }}
        transition={{ duration: 0.65, ease: EASE, delay: 0.1 }}
        whileHover={{ y: -5 }}
        className={cn(
          "col-start-2 w-full sm:max-w-[25rem]",
          left
            ? "sm:col-start-1 sm:justify-self-end sm:pr-[4.5rem]"
            : "sm:col-start-2 sm:justify-self-start sm:pl-[4.5rem]"
        )}
      >
        <div className="relative overflow-hidden rounded-[1.5rem] bg-white p-5 shadow-quiet transition-shadow hover:shadow-lift sm:p-6">
          <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: step.bar }} />
          <span className="ghost-number pointer-events-none absolute -right-2 -top-3 text-[5.5rem]">
            0{index + 1}
          </span>
          <h3 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
            {step.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.desc}</p>
          <div className="mt-4">{step.visual}</div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * The care loop as a scroll-animation tree: a central trunk draws itself down
 * the page as you scroll, and each stage branches off it — node popping onto
 * the trunk, branch line extending, card growing in from its side. The last
 * node loops back, because that's the point.
 */
export function CareLoop() {
  const treeRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: treeRef,
    offset: ["start 72%", "end 70%"],
  });
  const trunk = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.001 });

  return (
    <section id="care-journey" className="relative overflow-hidden px-6 py-28">
      {/* ambient depth */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-[12%] size-[340px] rounded-full bg-aria/10 blur-[90px]" />
        <div className="absolute -right-24 bottom-[8%] size-[380px] rounded-full bg-green/10 blur-[90px]" />
      </div>

      <div className="mx-auto max-w-5xl">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-green shadow-quiet">
            The care loop
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl">
            <WordReveal text="Every interaction, one episode." faintFrom={2} />
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            The north-star isn&rsquo;t logins or AI messages — it&rsquo;s resolved
            care episodes that close the loop and come back as follow-up.
          </p>
        </motion.div>

        {/* the tree */}
        <div ref={treeRef} className="relative mt-16">
          {/* trunk rail + the growing line */}
          <div className="absolute bottom-0 left-[22px] top-0 w-px -translate-x-1/2 bg-ink/10 sm:left-1/2" />
          <motion.div
            aria-hidden
            style={{ scaleY: trunk }}
            className="absolute bottom-0 left-[22px] top-0 w-[3px] -translate-x-1/2 origin-top rounded-full bg-gradient-to-b from-aria via-green to-red sm:left-1/2"
          />

          <div className="flex flex-col gap-10 sm:gap-4">
            {STEPS.map((s, i) => (
              <TreeStep key={s.title} step={s} index={i} />
            ))}
          </div>

          {/* the loop closes */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
            className="relative mt-10 flex justify-start pl-[3px] sm:justify-center sm:pl-0"
          >
            <div className="flex items-center gap-3 rounded-full bg-white py-2 pl-2.5 pr-5 shadow-quiet">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                className="grid size-9 place-items-center rounded-full bg-soft-green text-green"
              >
                <RefreshCw className="size-4.5" />
              </motion.span>
              <p className="text-sm font-semibold text-ink">
                The loop closes —{" "}
                <span className="text-ink-faint">and care continues.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
