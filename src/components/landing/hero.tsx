"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Sparkles, ShieldCheck, Globe2, Radio } from "lucide-react";
import { HeroVisual, HeroVisualMobile } from "@/components/landing/hero-visual";
import { Magnetic, EASE } from "@/components/landing/shared";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  // The composition gently recedes as the visitor scrolls on.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const visualScale = useTransform(scrollYProgress, [0, 1], [1, 0.93]);
  const visualOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.2]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden px-6 pb-20 pt-32 sm:pt-36 lg:pb-24"
    >
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-blob left-[4%] top-[8%] size-[400px] bg-blue/20" />
        <div className="aurora-blob right-[2%] top-[0%] size-[440px] bg-aria/16" style={{ animationDelay: "-7s" }} />
        <div className="aurora-blob bottom-[-4%] left-[36%] size-[380px] bg-green/12" style={{ animationDelay: "-14s" }} />
      </div>
      <div className="grain pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute inset-0 -z-10 grid-dots opacity-[0.32] [mask-image:radial-gradient(65%_55%_at_40%_35%,#000_10%,transparent_75%)]" />

      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* ── copy ── */}
        <motion.div style={{ y: copyY, opacity: copyOpacity }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-ink-soft shadow-quiet backdrop-blur"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green/60" />
              <span className="relative inline-flex size-2 rounded-full bg-green" />
            </span>
            AI-powered continuous healthcare · Live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}
            className="mt-7 font-display text-[3.4rem] font-extrabold leading-[0.98] tracking-tight sm:text-7xl xl:text-[5.2rem]"
          >
            <span className="text-ink">Healthcare</span>
            <br />
            <span className="text-ink">that never</span>
            <br />
            <span className="bg-gradient-to-r from-blue via-aria to-green bg-clip-text text-transparent">
              stops.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.18 }}
            className="mt-7 max-w-lg text-lg leading-relaxed text-ink-soft sm:text-xl"
          >
            AI-powered clinical intelligence helping doctors deliver faster,
            safer, more accessible care across rural India.{" "}
            <span className="font-semibold text-ink">ARIA</span> listens to
            patients in their own language, structures every case, and hands it
            to a licensed doctor — care that continues long after the call ends.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.28 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Magnetic className="w-full sm:w-auto">
              <Link
                href="/portal"
                className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ink px-8 text-[15px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] sm:w-auto"
              >
                Start Consultation
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Magnetic>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-medium text-ink-faint"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-aria" /> ARIA AI intake
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Radio className="size-3.5 text-green" /> Realtime triage
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-blue" /> Consent-gated records
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="size-3.5" /> Built for the world
            </span>
          </motion.div>
        </motion.div>

        {/* ── living workspace visualization ── */}
        <motion.div
          initial={{ opacity: 0, y: 44, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.95, ease: EASE, delay: 0.3 }}
        >
          <motion.div style={{ y: visualY, scale: visualScale, opacity: visualOpacity }}>
            <HeroVisual />
            <HeroVisualMobile />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
