"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
  useTransform,
} from "motion/react";
import { WordReveal } from "@/components/landing/word-reveal";
import { cn } from "@/lib/utils";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** True below the given width — used to swap heavy effects for cheap ones. */
export function useIsMobile(query = "(max-width: 640px)") {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return mobile;
}

/** Standard fade/slide reveal with optional direction. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  from = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  from?: "up" | "left" | "right" | "scale";
}) {
  const initial =
    from === "left"
      ? { opacity: 0, x: -56 }
      : from === "right"
        ? { opacity: 0, x: 56 }
        : from === "scale"
          ? { opacity: 0, scale: 0.94, y: 24 }
          : { opacity: 0, y: 28 };
  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Consistent section header: eyebrow chip + two-tone word-reveal title + sub. */
export function SectionHeader({
  eyebrow,
  color,
  title,
  faintFrom,
  sub,
  align = "center",
}: {
  eyebrow: string;
  color: string;
  title: string;
  faintFrom?: number;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left"
      )}
    >
      <span
        className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-quiet"
        style={{ color }}
      >
        {eyebrow}
      </span>
      <h2 className="mt-5 text-balance font-display text-[1.9rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
        <WordReveal text={title} faintFrom={faintFrom} />
      </h2>
      {sub && (
        <p className="mt-5 text-lg leading-relaxed text-ink-soft sm:text-xl">
          {sub}
        </p>
      )}
    </Reveal>
  );
}

/** Button wrapper that leans toward the cursor (subtle magnetic pull). */
export function Magnetic({
  children,
  className,
  strength = 0.25,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 260, damping: 20 });
  const y = useSpring(0, { stiffness: 260, damping: 20 });

  function onMove(e: React.MouseEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}

/** Animated counter that counts up when it enters the viewport. */
export function Counter({
  to,
  suffix = "",
  className,
}: {
  to: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useSpring(0, { stiffness: 55, damping: 18 });
  const [txt, setTxt] = useState("0");
  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, to, mv]);
  useMotionValueEvent(mv, "change", (v) => setTxt(String(Math.round(v))));
  return (
    <span ref={ref} className={cn("tnum", className)}>
      {txt}
      {suffix}
    </span>
  );
}

/** A layer that drifts with the pointer — depth via per-layer factor. */
export function Parallax({
  mx,
  my,
  factor,
  className,
  children,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  factor: number;
  className?: string;
  children: React.ReactNode;
}) {
  const x = useTransform(mx, (v) => v * factor);
  const y = useTransform(my, (v) => v * factor);
  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}
