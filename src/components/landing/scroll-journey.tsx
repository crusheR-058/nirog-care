"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from "motion/react";
import {
  IntakeDiorama,
  TriageDiorama,
  ConsultDiorama,
  CarePlanDiorama,
  ContinuityDiorama,
} from "@/components/landing/dioramas";

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

  // Camera dive — compact: reaches focus fast and holds for most of the scene,
  // so each scene reads within roughly one screen of scrolling.
  const scale = useTransform(p, [0, 0.4, 0.68, 1], [0.86, 1, 1, 1.08]);
  const opacity = useTransform(p, [0, 0.14, 0.82, 1], [0, 1, 1, 0]);
  const blur = useTransform(p, [0, 0.28, 0.74, 1], [6, 0, 0, 6]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const y = useTransform(p, [0, 0.4, 1], [42, 0, -30]);

  // Copy slides in slightly out of phase with the diorama.
  const copyY = useTransform(p, [0.08, 0.4, 0.9], [30, 0, -24]);
  const copyOpacity = useTransform(p, [0.08, 0.26, 0.8, 0.96], [0, 1, 1, 0]);

  const isEven = index % 2 === 0;
  const Diorama = scene.Diorama;

  return (
    <section
      ref={ref}
      className="relative h-[125vh]"
      aria-labelledby={`scene-${scene.id}`}
    >
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-4 px-6 lg:grid-cols-2 lg:gap-10">
          {/* Copy */}
          <motion.div
            style={{ y: copyY, opacity: copyOpacity }}
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
            </div>
            <h2
              id={`scene-${scene.id}`}
              className="mt-5 font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-ink sm:text-5xl"
            >
              {scene.title}
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
              {scene.body}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {scene.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-ink-soft shadow-quiet backdrop-blur"
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Diorama stage */}
          <motion.div
            style={{ scale, opacity, filter, y }}
            className={`relative mx-auto aspect-square w-full max-w-[440px] ${
              isEven ? "lg:order-2" : "lg:order-1"
            }`}
          >
            {/* accent halo */}
            <div
              className="absolute inset-[12%] rounded-full opacity-30 blur-3xl"
              style={{ background: scene.accent }}
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

export function ScrollJourney() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  return (
    <div id="world" ref={wrapRef} className="relative">
      <Atmosphere progress={scrollYProgress} />
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
