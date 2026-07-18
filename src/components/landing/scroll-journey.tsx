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
import { useIsMobile } from "@/components/landing/shared";

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

const N = SCENES.length;

const chipVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.92 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
      delay: 0.08 + i * 0.05,
    },
  }),
};

/**
 * One layer of the continuous flight. All layers live in the SAME pinned
 * viewport; local progress li = p*N - i. A scene flies in from depth
 * (small, blurred), holds focus while the camera keeps drifting closer, then
 * flies PAST the camera (scales up, fades) exactly while the next scene is
 * emerging — overlapping windows mean there is never a cut or an empty frame.
 */
function SceneLayer({
  scene,
  index,
  p,
}: {
  scene: Scene;
  index: number;
  p: MotionValue<number>;
}) {
  const isLast = index === N - 1;
  const dir = index % 2 === 0 ? 1 : -1;
  const mobile = useIsMobile();

  const li = useTransform(p, (v) => v * N - index);

  // Diorama: fly in from depth → gentle approach → fly through the camera.
  const scale = useTransform(
    li,
    [-0.34, 0, 0.62, 1],
    [0.55, 1, 1.07, isLast ? 1.1 : 1.6]
  );
  const opacity = useTransform(
    li,
    [-0.34, -0.06, 0.62, isLast ? 10 : 0.94],
    [0, 1, 1, isLast ? 1 : 0]
  );
  const blur = useTransform(
    li,
    [-0.34, -0.08, 0.62, isLast ? 10 : 0.94],
    mobile ? [0, 0, 0, 0] : [10, 0, 0, isLast ? 0 : 9]
  );
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const y = useTransform(li, [-0.34, 0, 1], mobile ? [40, 0, -16] : [72, 0, -26]);
  const x = useTransform(li, [-0.34, 0, 1], mobile ? [20 * dir, 0, -10 * dir] : [46 * dir, 0, -20 * dir]);

  // Copy: slides in from the side, exits faster than it entered.
  const copyOpacity = useTransform(
    li,
    [-0.28, -0.08, 0.5, isLast ? 10 : 0.72],
    [0, 1, 1, isLast ? 1 : 0]
  );
  const copyX = useTransform(
    li,
    [-0.28, -0.04, 0.5, 0.76],
    mobile ? [36 * dir, 0, 0, isLast ? 0 : -20 * dir] : [96 * dir, 0, 0, isLast ? 0 : -54 * dir]
  );

  // Ghost number drifts on its own plane.
  const ghostY = useTransform(li, [-0.34, 1], ["16%", "-18%"]);
  const ghostOpacity = useTransform(
    li,
    [-0.26, -0.06, 0.55, isLast ? 10 : 0.8],
    [0, 1, 1, isLast ? 1 : 0]
  );

  // Orbit rings counter-rotate through the pass.
  const ringRotate = useTransform(li, [-0.34, 1], [-16 * dir, 16 * dir]);
  const ringRotateInv = useTransform(ringRotate, (r) => -r);
  const underline = useTransform(li, [0.02, 0.3], [0, 1]);

  // Chips pop only while the scene holds focus.
  const [active, setActive] = useState(index === 0);
  useMotionValueEvent(li, "change", (v) => setActive(v > -0.05 && v < 0.62));

  const Diorama = scene.Diorama;

  return (
    <div
      className="absolute inset-0 flex items-center"
      style={{ zIndex: N - index }}
      aria-hidden={!active}
    >
      {/* giant ghost number — its own parallax plane */}
      <motion.span
        className="ghost-number pointer-events-none absolute top-1/2 select-none text-[24vh] sm:text-[56vh]"
        style={{
          [dir === 1 ? "right" : "left"]: "-2%",
          y: ghostY,
          opacity: ghostOpacity,
          translateY: "-50%",
        }}
      >
        {scene.no}
      </motion.span>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-4 px-6 pt-12 sm:gap-6 sm:pt-0 lg:grid-cols-2 lg:gap-12">
        {/* Copy */}
        <motion.div
          style={{ x: copyX, opacity: copyOpacity }}
          className={dir === 1 ? "lg:order-1" : "lg:order-2"}
        >
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
              {index + 1} / {N}
            </span>
          </div>
          <h2
            id={`scene-${scene.id}`}
            className="mt-4 font-display text-[1.9rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:mt-5 sm:text-5xl lg:text-6xl"
          >
            {scene.title}
          </h2>
          <motion.div
            className="mt-4 h-1 w-24 origin-left rounded-full"
            style={{ background: scene.accent, scaleX: underline }}
          />
          <p className="mt-3.5 max-w-md text-[15px] leading-relaxed text-ink-soft sm:mt-4 sm:text-base">
            {scene.body}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 sm:mt-7">
            {scene.tags.map((t, i) => (
              <motion.span
                key={t}
                custom={i}
                variants={chipVariants}
                initial="hidden"
                animate={active ? "show" : "hidden"}
                className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-quiet backdrop-blur sm:px-4 sm:py-2"
              >
                {t}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Diorama stage */}
        <motion.div
          style={{ scale, opacity, filter, y, x }}
          className={`relative mx-auto aspect-square w-full max-w-[290px] sm:max-w-[500px] ${
            dir === 1 ? "lg:order-2" : "lg:order-1"
          }`}
        >
          <div
            className="absolute inset-[6%] rounded-full opacity-30 blur-3xl"
            style={{ background: scene.accent }}
          />
          <div
            className="absolute inset-[26%] rounded-full opacity-20 blur-2xl"
            style={{ background: scene.accent }}
          />
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
  );
}

function Atmosphere({ progress }: { progress: MotionValue<number> }) {
  const stops = SCENES.map((_, i) => i / (N - 1));
  const background = useTransform(
    progress,
    stops,
    SCENES.map((s) => s.sky)
  );
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{ background }}
    />
  );
}

/** Fixed rail showing where you are in the flight. */
function ProgressRail({ progress }: { progress: MotionValue<number> }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(progress, "change", (v) => {
    setVisible(v > 0.005 && v < 0.995);
    setIdx(Math.min(N - 1, Math.max(0, Math.floor(v * N))));
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
              background:
                i === idx
                  ? s.accent
                  : "color-mix(in srgb, var(--ink) 18%, transparent)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * The care world as ONE continuous, pinned flight (scroll-world principle:
 * no cuts). All five scenes share a single sticky viewport; scroll scrubs the
 * camera through them with overlapping seams, so one scene flies past the
 * lens exactly while the next emerges from depth.
 */
export function ScrollJourney() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <div id="world" ref={wrapRef} className="relative h-[550vh]">
      {/* raw progress: the sprung value settles short of 1 and leaks the rail */}
      <ProgressRail progress={scrollYProgress} />
      <div className="sticky top-0 h-dvh overflow-hidden">
        <Atmosphere progress={p} />
        {SCENES.map((scene, i) => (
          <SceneLayer key={scene.id} scene={scene} index={i} p={p} />
        ))}
      </div>
    </div>
  );
}
