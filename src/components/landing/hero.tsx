"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Radio,
  CheckCircle2,
  Globe2,
} from "lucide-react";
import { ProductWindow } from "@/components/landing/product-window";

const ease = [0.22, 1, 0.36, 1] as const;

function Chip({
  className,
  delay,
  children,
}: {
  className: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease, delay }}
      className={`absolute z-20 hidden md:block ${className}`}
    >
      <div className="float-y rounded-2xl bg-white/90 px-3.5 py-2.5 shadow-float ring-1 ring-black/[0.04] backdrop-blur">
        {children}
      </div>
    </motion.div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  // As the visitor scrolls away, the product window recedes in 3D.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const winY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const winRotateX = useTransform(scrollYProgress, [0, 1], [0, 14]);
  const winScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const winOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden px-6 pb-16 pt-32 sm:pt-36">
      {/* aurora + texture */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-blob left-[8%] top-[6%] size-[380px] bg-blue/25" />
        <div className="aurora-blob right-[6%] top-[2%] size-[420px] bg-aria/20" style={{ animationDelay: "-7s" }} />
        <div className="aurora-blob bottom-[0%] left-[38%] size-[360px] bg-green/15" style={{ animationDelay: "-14s" }} />
      </div>
      <div className="grain pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute inset-0 -z-10 grid-dots opacity-[0.35] [mask-image:radial-gradient(70%_55%_at_50%_30%,#000_10%,transparent_75%)]" />

      <motion.div style={{ y: copyY, opacity: copyOpacity }} className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-ink-soft shadow-quiet backdrop-blur"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green/60" />
            <span className="relative inline-flex size-2 rounded-full bg-green" />
          </span>
          Now live · Doctor workspace + patient app
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease, delay: 0.08 }}
          className="mt-7 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
        >
          <span className="text-ink">Continuous care,</span>
          <br />
          <span className="bg-gradient-to-r from-blue via-aria to-green bg-clip-text text-transparent">
            from first symptom
          </span>
          <br />
          <span className="text-ink-faint">to signed care plan.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.18 }}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft"
        >
          The doctor platform behind Nirog — voice-first AI intake, a live triage
          workspace, and consent-gated records. Built for rural India, designed
          for the world.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.26 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/portal"
            className="group inline-flex h-13 items-center gap-2 rounded-full bg-ink px-8 text-[15px] font-semibold text-white transition-transform hover:brightness-110 active:scale-[0.97]"
          >
            Enter the workspace
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#world"
            className="inline-flex h-13 items-center rounded-full bg-white px-8 text-[15px] font-semibold text-ink shadow-quiet transition-transform hover:shadow-lift active:scale-[0.97]"
          >
            Explore the platform
          </a>
        </motion.div>
      </motion.div>

      {/* product window with floating chips — recedes in 3D on scroll */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease, delay: 0.32 }}
        className="relative mx-auto mt-16 max-w-2xl"
        style={{ perspective: 1400 }}
      >
        <motion.div
          style={{ y: winY, scale: winScale, opacity: winOpacity, rotateX: winRotateX, transformStyle: "preserve-3d" }}
        >
        <div className="pointer-events-none absolute -inset-x-16 -inset-y-10 -z-10 rounded-[3rem] bg-gradient-to-b from-white/60 to-transparent blur-2xl" />
        <ProductWindow />
        {/* mirror reflection, Apple keynote style */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-full mt-1 h-44 origin-top -scale-y-100 overflow-hidden opacity-[0.14] blur-[1.5px] [mask-image:linear-gradient(to_top,black,transparent_72%)]"
        >
          <ProductWindow />
        </div>

        <Chip className="-left-8 top-16" delay={0.7}>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-aria">
            <Sparkles className="size-3.5" /> ARIA intake
          </p>
          <p className="text-[11px] text-ink-soft">Hindi · 82% confidence</p>
        </Chip>
        <Chip className="-right-6 top-28" delay={0.85}>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-green">
            <Radio className="size-3.5" /> Realtime queue
          </p>
        </Chip>
        <Chip className="-left-6 bottom-10" delay={1}>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-blue">
            <ShieldCheck className="size-3.5" /> RLS-enforced
          </p>
        </Chip>
        <Chip className="-right-8 bottom-20" delay={1.15}>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <CheckCircle2 className="size-3.5 text-green" /> Care filed
          </p>
        </Chip>
        </motion.div>
      </motion.div>

      {/* trust strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-ink-faint"
      >
        <span className="inline-flex items-center gap-1.5"><Globe2 className="size-4" /> 7+ countries supported</span>
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4" /> DPDP + ABDM aligned</span>
        <span className="inline-flex items-center gap-1.5"><Sparkles className="size-4" /> ARIA AI intake</span>
        <span className="inline-flex items-center gap-1.5"><Radio className="size-4" /> Realtime</span>
      </motion.div>

      <a
        href="#world"
        aria-label="Scroll to explore"
        className="mt-14 flex flex-col items-center gap-1 text-xs font-semibold text-ink-faint"
      >
        Scroll to fly through the care world
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="size-5" />
        </motion.span>
      </a>
    </section>
  );
}
