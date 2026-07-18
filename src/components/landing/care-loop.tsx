"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
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
  { icon: Mic, tone: "text-aria bg-soft-purple", dot: "var(--aria)", title: "Intake", desc: "ARIA listens, by voice" },
  { icon: Stethoscope, tone: "text-blue bg-soft-blue", dot: "var(--blue)", title: "Review", desc: "Doctor sees red flags" },
  { icon: Video, tone: "text-green bg-soft-green", dot: "var(--green)", title: "Consult", desc: "Audio · video · chat" },
  { icon: ClipboardCheck, tone: "text-amber bg-soft-amber", dot: "var(--amber)", title: "Care plan", desc: "Notes + prescription" },
  { icon: Pill, tone: "text-indigo bg-soft-indigo", dot: "var(--indigo)", title: "Fulfil", desc: "Medicines & tests" },
  { icon: BellRing, tone: "text-red bg-soft-red", dot: "var(--red)", title: "Follow-up", desc: "Reminders return" },
];

export function CareLoop() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 55%"],
  });
  const drawn = useSpring(useTransform(scrollYProgress, [0.25, 0.9], [0, 1]), {
    stiffness: 90,
    damping: 24,
  });

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-28">
      {/* ambient depth */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-blob left-[10%] top-[20%] size-[320px] bg-aria/12" />
        <div className="aurora-blob right-[8%] bottom-[10%] size-[360px] bg-green/12" style={{ animationDelay: "-9s" }} />
      </div>

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
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

        {/* flow with a line that draws itself as you scroll */}
        <div className="relative mt-16">
          <div className="pointer-events-none absolute left-[4%] right-[4%] top-7 hidden h-[3px] overflow-hidden rounded-full bg-white/60 md:block">
            <motion.div
              className="h-full w-full origin-left rounded-full bg-gradient-to-r from-aria via-green to-red"
              style={{ scaleX: drawn }}
            />
          </div>

          <div className="grid grid-cols-2 gap-y-10 md:grid-cols-6 md:gap-0">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 34, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, ease, delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="relative flex flex-col items-center px-2 text-center"
                >
                  <span
                    className={`relative z-10 grid size-14 place-items-center rounded-2xl shadow-quiet ring-4 ring-canvas transition-shadow hover:shadow-lift ${s.tone}`}
                  >
                    <Icon className="size-6" />
                    <span
                      className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-canvas"
                      style={{ background: s.dot }}
                    />
                  </span>
                  <span className="mt-2.5 text-[11px] font-bold text-ink-faint">
                    0{i + 1}
                  </span>
                  <p className="mt-0.5 font-display font-extrabold text-ink">
                    {s.title}
                  </p>
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
