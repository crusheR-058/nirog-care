"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import {
  IntakeDiorama,
  TriageDiorama,
  ConsultDiorama,
  CarePlanDiorama,
  ContinuityDiorama,
} from "@/components/landing/dioramas";
import { cn } from "@/lib/utils";

interface Scene {
  id: string;
  no: string;
  eyebrow: string;
  title: string;
  body: string;
  tags: string[];
  accent: string;
  sky: string; // atmosphere gradient for this beat
  Diorama: () => React.ReactElement;
}

const SCENES: Scene[] = [
  {
    id: "intake",
    no: "01",
    eyebrow: "Intake",
    title: "Care begins with a voice.",
    body: "In a village with one bar of signal, ARIA listens in the patient's own language, turning a spoken worry into a structured clinical picture — no typing, no forms.",
    tags: ["Voice-first", "Hindi & regional", "Low-bandwidth"],
    accent: "var(--aria)",
    sky: "radial-gradient(110% 85% at 50% 0%, #e5ddfa 0%, #d9e5f6 60%)",
    Diorama: IntakeDiorama,
  },
  {
    id: "triage",
    no: "02",
    eyebrow: "Triage",
    title: "The AI hands off to a human.",
    body: "ARIA's summary and deterministic red flags land in the doctor's queue, sorted by urgency. The clinician sees the whole picture before the call connects — and decides.",
    tags: ["Red-flag escalation", "Priority queue", "Unverified until accepted"],
    accent: "var(--blue)",
    sky: "radial-gradient(110% 85% at 50% 0%, #c8ddfa 0%, #d9e5f6 60%)",
    Diorama: TriageDiorama,
  },
  {
    id: "consult",
    no: "03",
    eyebrow: "Consult",
    title: "Audio-first, even on a weak signal.",
    body: "Video when the network allows, audio when it doesn't, chat when it must — the consultation degrades gracefully and resumes where it dropped. Distance stops being the barrier.",
    tags: ["Graceful downgrade", "Resumable", "Assisted mode"],
    accent: "var(--green)",
    sky: "radial-gradient(110% 85% at 50% 0%, #d3f0de 0%, #d9e5f6 60%)",
    Diorama: ConsultDiorama,
  },
  {
    id: "careplan",
    no: "04",
    eyebrow: "Care plan",
    title: "A plan that returns as care.",
    body: "Notes, prescription and follow-up are filed under the doctor's registration and delivered back to the patient's app — as medicines to collect, tests to take, and reminders that arrive.",
    tags: ["Signed prescriptions", "Fulfilment", "Follow-up reminders"],
    accent: "var(--amber)",
    sky: "radial-gradient(110% 85% at 50% 0%, #fbe9cf 0%, #d9e5f6 60%)",
    Diorama: CarePlanDiorama,
  },
  {
    id: "continuity",
    no: "05",
    eyebrow: "Continuity",
    title: "One connected care episode.",
    body: "Every step is stitched into a single longitudinal record the patient controls — consent-gated, fully audited. Not logins or AI messages. Resolved care, under difficult conditions.",
    tags: ["Consent-driven", "Longitudinal record", "Immutable audit"],
    accent: "var(--blue)",
    sky: "radial-gradient(110% 85% at 50% 0%, #cfdcfb 0%, #d9e5f6 60%)",
    Diorama: ContinuityDiorama,
  },
];

const chipVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.92 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
      delay: 0.1 + i * 0.09,
    },
  }),
};

function SceneStage({
  scene,
  index,
  total,
}: {
  scene: Scene;
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const p = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  const isEven = index % 2 === 0;
  const dir = isEven ? 1 : -1;

  // Camera dive — reaches focus fast, holds, then flies past.
  const scale = useTransform(p, [0, 0.4, 0.68, 1], [0.84, 1, 1, 1.1]);
  const opacity = useTransform(p, [0, 0.14, 0.82, 1], [0, 1, 1, 0]);
  const blur = useTransform(p, [0, 0.28, 0.74, 1], [7, 0, 0, 7]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const y = useTransform(p, [0, 0.4, 1], [48, 0, -36]);
  // Diorama glides in from its side and tilts as it passes.
  const dioramaX = useTransform(p, [0, 0.42, 1], [110 * dir, 0, -60 * dir]);
  const rotate = useTransform(p, [0, 0.42, 1], [5 * dir, 0, -3.5 * dir]);

  // Copy slides in from the opposite side, out of phase.
  const copyX = useTransform(p, [0.06, 0.4, 1], [-90 * dir, 0, 30 * dir]);
  const copyY = useTransform(p, [0.08, 0.4, 0.9], [26, 0, -20]);
  const copyOpacity = useTransform(p, [0.08, 0.28, 0.8, 0.96], [0, 1, 1, 0]);

  // Ghost number drifts on its own plane (parallax) and fades at the seams.
  const ghostY = useTransform(p, [0, 1], ["12%", "-14%"]);
  const ghostOpacity = useTransform(p, [0.05, 0.35, 0.75, 0.98], [0, 1, 1, 0]);

  // Orbit rings counter-rotate subtly for depth.
  const ringRotate = useTransform(p, [0, 1], [-14 * dir, 14 * dir]);
  const ringRotateInv = useTransform(ringRotate, (r) => -r);
  const underline = useTransform(p, [0.22, 0.5], [0, 1]);

  // Stagger the tag chips only while the scene is in focus.
  const [active, setActive] = useState(false);
  useMotionValueEvent(p, "change", (v) => setActive(v > 0.24 && v < 0.9));

  const Diorama = scene.Diorama;

  return (
    <section
      ref={ref}
      className="relative h-[125vh]"
      aria-labelledby={`scene-${scene.id}`}
    >
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
        {/* giant ghost number — parallax layer */}
        <motion.span
          className="ghost-number pointer-events-none absolute top-1/2 select-none text-[42vh] sm:text-[56vh]"
          style={{
            [isEven ? "right" : "left"]: "-2%",
            y: ghostY,
            opacity: ghostOpacity,
            translateY: "-50%",
          }}
          aria-hidden
        >
          {scene.no}
        </motion.span>

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 px-6 lg:grid-cols-2 lg:gap-12">
          {/* Copy */}
          <motion.div
            style={{ x: copyX, y: copyY, opacity: copyOpacity }}
            className={isEven ? "lg:order-1" : "lg:order-2"}
          >
            {/* App-style chip pair: black number pill + white eyebrow chip */}
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-ink text-xs font-bold text-white">
                {scene.no}
              </span>
              <span
                className="rounded-full bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-quiet backdrop-blur"
                style={{ color: scene.accent }}
              >
                {scene.eyebrow}
              </span>
              <span className="text-xs font-medium text-ink-faint">
                {index + 1} / {total}
              </span>
            </div>
            <h2
              id={`scene-${scene.id}`}
              className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl"
            >
              {scene.title}
            </h2>
            {/* accent underline that draws with the scene */}
            <motion.div
              className="mt-4 h-1 w-24 origin-left rounded-full"
              style={{ background: scene.accent, scaleX: underline }}
            />
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
              {scene.body}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {scene.tags.map((t, i) => (
                <motion.span
                  key={t}
                  custom={i}
                  variants={chipVariants}
                  initial="hidden"
                  animate={active ? "show" : "hidden"}
                  className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-ink-soft shadow-quiet backdrop-blur"
                >
                  {t}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Diorama stage */}
          <motion.div
            style={{ scale, opacity, filter, y, x: dioramaX, rotate }}
            className={`relative mx-auto aspect-square w-full max-w-[500px] ${
              isEven ? "lg:order-2" : "lg:order-1"
            }`}
          >
            {/* layered accent glow */}
            <div
              className="absolute inset-[6%] rounded-full opacity-30 blur-3xl"
              style={{ background: scene.accent }}
            />
            <div
              className="absolute inset-[26%] rounded-full opacity-20 blur-2xl"
              style={{ background: scene.accent }}
            />
            {/* counter-rotating orbit rings */}
            <motion.div
              className="absolute inset-[4%] rounded-full border border-white/50"
              style={{ rotate: ringRotate }}
            >
              <span
                className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full"
                style={{ background: scene.accent }}
              />
            </motion.div>
            <motion.div
              className="absolute inset-[16%] rounded-full border border-dashed border-white/40"
              style={{ rotate: ringRotateInv }}
            />
            <Diorama />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Atmosphere({ progress }: { progress: MotionValue<number> }) {
  // Interpolate the sky through every scene's gradient for a continuous world.
  const stops = SCENES.map((_, i) => i / (SCENES.length - 1));
  const background = useTransform(
    progress,
    stops,
    SCENES.map((s) => s.sky)
  );
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background }}
    />
  );
}

/** Fixed rail showing where you are in the flight; visible only mid-journey. */
function ProgressRail({ progress }: { progress: MotionValue<number> }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(progress, "change", (v) => {
    setVisible(v > 0.005 && v < 0.995);
    setIdx(Math.min(SCENES.length - 1, Math.max(0, Math.floor(v * SCENES.length))));
  });

  return (
    <div
      className={cn(
        "fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-3.5 transition-opacity duration-500 lg:flex",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden
    >
      {SCENES.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2.5">
          <span
            className={cn(
              "rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-quiet backdrop-blur transition-all duration-300",
              i === idx ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
            )}
            style={{ color: s.accent }}
          >
            {s.eyebrow}
          </span>
          <span
            className="rounded-full transition-all duration-300"
            style={{
              width: i === idx ? 10 : 7,
              height: i === idx ? 10 : 7,
              background: i === idx ? s.accent : "color-mix(in srgb, var(--ink) 18%, transparent)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function ScrollJourney() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  return (
    <div id="world" ref={wrapRef} className="relative">
      <Atmosphere progress={scrollYProgress} />
      <ProgressRail progress={scrollYProgress} />
      {SCENES.map((scene, i) => (
        <SceneStage
          key={scene.id}
          scene={scene}
          index={i}
          total={SCENES.length}
        />
      ))}
    </div>
  );
}
