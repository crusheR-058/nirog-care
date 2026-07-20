"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
// Iris centre = the logo's heart. All exit choreography radiates from here.
const IRIS = "50% 44%";

/**
 * The entry gate: visitors land on a full-screen Nirog stage — breathing logo,
 * orbit ring, pulse waves, staggered wordmark. The FIRST scroll (wheel, touch
 * or key) fires the break-through: the logo charges and flies through the
 * camera while the whole screen irises open from the logo's centre, revealing
 * the landing page beneath. No route change — the visitor simply arrives.
 *
 * The overlay does all the animating; the landing content is never transformed
 * (a transformed ancestor would re-anchor the page's fixed nav/journey layers).
 */
export function IntroGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"idle" | "exit" | "done">("idle");
  const armedRef = useRef(true);

  // Hold the page still while the gate is up.
  useEffect(() => {
    if (phase === "done") return;
    const el = document.documentElement;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    return () => {
      el.style.overflow = prev;
    };
  }, [phase]);

  // Accessibility: reduced motion skips the theatrics entirely.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      armedRef.current = false;
      setPhase("done");
    }
  }, []);

  // Arm the break-through triggers.
  useEffect(() => {
    if (phase !== "idle") return;
    const go = () => {
      if (!armedRef.current) return;
      armedRef.current = false;
      setPhase("exit");
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 4) go();
    };
    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (touchY !== null && y !== undefined && touchY - y > 10) go();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) go();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase]);

  const exiting = phase === "exit";

  return (
    <>
      {children}

      {phase !== "done" && (
        <motion.div
          data-intro-gate
          className="fixed inset-0 z-[90] overflow-hidden bg-[#d9e5f6]"
          initial={{ clipPath: `circle(125% at ${IRIS})` }}
          animate={
            exiting
              ? { clipPath: `circle(0% at ${IRIS})` }
              : { clipPath: `circle(125% at ${IRIS})` }
          }
          transition={
            exiting
              ? { duration: 0.95, ease: [0.7, 0, 0.24, 1], delay: 0.3 }
              : { duration: 0 }
          }
          onAnimationComplete={() => {
            if (exiting) {
              window.scrollTo(0, 0);
              setPhase("done");
            }
          }}
        >
          {/* stage atmosphere */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_85%_at_50%_0%,#e5ddfa_0%,#d9e5f6_55%,#cfdcf5_100%)]" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="aurora-blob left-[8%] top-[12%] size-[380px] bg-blue/20" />
            <div
              className="aurora-blob right-[4%] top-[30%] size-[420px] bg-aria/16"
              style={{ animationDelay: "-8s" }}
            />
            <div
              className="aurora-blob bottom-[-6%] left-[30%] size-[360px] bg-green/14"
              style={{ animationDelay: "-15s" }}
            />
          </div>
          <div className="grain pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 grid-dots opacity-40 [mask-image:radial-gradient(60%_50%_at_50%_44%,#000_20%,transparent_75%)]" />

          {/* break-through flash — flares as the iris opens */}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_44%,#ffffff_0%,transparent_70%)]"
            initial={{ opacity: 0 }}
            animate={exiting ? { opacity: [0, 0.75, 0] } : { opacity: 0 }}
            transition={{ duration: 0.7, times: [0, 0.35, 1], delay: 0.18 }}
          />

          {/* ── the logo stage ── */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            {/* fly-through: charge, then blast past the camera */}
            <motion.div
              className="relative flex flex-col items-center"
              animate={
                exiting
                  ? { scale: [1, 0.86, 24], opacity: [1, 1, 0], y: [0, 6, 0] }
                  : { scale: 1, opacity: 1, y: 0 }
              }
              transition={
                exiting
                  ? { duration: 1.05, times: [0, 0.24, 1], ease: [0.6, 0, 0.3, 1] }
                  : undefined
              }
            >
              {/* pulse waves radiating from the heart */}
              {[0, 1.1].map((delay) => (
                <motion.span
                  key={delay}
                  className="absolute left-1/2 top-[38%] size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue/30"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={
                    exiting
                      ? { opacity: 0 }
                      : { scale: [0.6, 2.1], opacity: [0.55, 0] }
                  }
                  transition={{
                    duration: 2.2,
                    delay,
                    repeat: exiting ? 0 : Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}
              {/* slow orbit ring */}
              <motion.span
                className="absolute left-1/2 top-[38%] size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-ink/15 sm:size-64"
                animate={{ rotate: 360 }}
                transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
              >
                <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-aria" />
                <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-green" />
              </motion.span>

              {/* the mark — soft glow + breathing */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: EASE }}
                className="relative"
              >
                <div className="absolute inset-[-40%] rounded-full bg-white/60 blur-3xl" />
                <motion.img
                  src="/logo.png"
                  alt="Nirog"
                  className="relative h-24 w-24 object-contain drop-shadow-[0_12px_32px_rgba(47,124,246,0.25)] sm:h-28 sm:w-28"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>

              {/* wordmark — letters rise one by one */}
              <div className="mt-6 flex items-end" aria-hidden>
                {"Nirog".split("").map((ch, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.35 + i * 0.07 }}
                    className="font-display text-5xl font-extrabold tracking-tight text-ink sm:text-6xl"
                  >
                    {ch}
                  </motion.span>
                ))}
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: [0, 1.4, 1] }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="mb-2.5 ml-1.5 size-3 rounded-full bg-blue sm:mb-3"
                />
              </div>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.95 }}
                className="mt-3 text-sm font-medium text-ink-soft sm:text-base"
              >
                Healthcare that never stops.
              </motion.p>
            </motion.div>

            {/* scroll cue */}
            <motion.button
              type="button"
              onClick={() => {
                if (armedRef.current) {
                  armedRef.current = false;
                  setPhase("exit");
                }
              }}
              initial={{ opacity: 0 }}
              animate={exiting ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.8, delay: exiting ? 0 : 1.5 }}
              className="absolute bottom-10 flex cursor-pointer flex-col items-center gap-2.5 text-ink-faint"
              aria-label="Enter the site"
            >
              <span className="relative h-9 w-[22px] rounded-full border-2 border-ink/25">
                <motion.span
                  className="absolute left-1/2 top-1.5 size-1.5 -translate-x-1/2 rounded-full bg-ink/50"
                  animate={{ y: [0, 12, 0], opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest">
                Scroll to enter
              </span>
              <motion.span
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="size-4" />
              </motion.span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </>
  );
}
