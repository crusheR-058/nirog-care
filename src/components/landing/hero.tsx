"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ChevronDown, Mic, MessageCircle } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const ariaChips = ["Should I be worried?", "What happens next?"];

export function Hero() {
  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-28 text-center">
      {/* Soft glow behind the headline, like the app's airy canvas */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 -z-10 size-80 rounded-full bg-aria/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-24 -z-10 size-80 rounded-full bg-blue/15 blur-3xl" />

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-ink-soft shadow-quiet backdrop-blur"
      >
        <span className="size-2 rounded-full bg-green" />
        Nirog Care Platform · Doctor workspace
      </motion.p>

      {/* Two-tone greeting headline — the patient app's signature type pattern */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.08 }}
        className="mt-7 max-w-4xl font-display text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl"
      >
        <span className="text-ink">From a voice in a village,</span>
        <br />
        <span className="text-ink-faint">to a doctor&rsquo;s sign-off.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.16 }}
        className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft"
      >
        Nirog turns every symptom, consult and prescription into one connected
        care episode. Scroll to fly through the journey.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.24 }}
        className="mt-9 flex flex-wrap items-center justify-center gap-3"
      >
        <Link
          href="/portal"
          className="inline-flex h-13 items-center gap-2 rounded-full bg-ink px-8 text-[15px] font-semibold text-white transition-transform hover:brightness-110 active:scale-[0.97]"
        >
          Enter workspace <ArrowRight className="size-4" />
        </Link>
        <a
          href="#world"
          className="inline-flex h-13 items-center rounded-full bg-white px-8 text-[15px] font-semibold text-ink shadow-quiet transition-transform hover:shadow-lift active:scale-[0.97]"
        >
          See the care world
        </a>
      </motion.div>

      {/* ARIA chips — lifted straight from the patient app's home screen */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.36 }}
        className="mt-14"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
          ARIA answers patients in their own language
        </p>
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
          {ariaChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-quiet"
            >
              {chip}
            </span>
          ))}
          <span className="grid size-11 place-items-center rounded-full bg-white shadow-quiet">
            <Mic className="size-[18px] text-blue" />
          </span>
          <span className="grid size-11 place-items-center rounded-full bg-white shadow-quiet">
            <MessageCircle className="size-[18px] text-ink-soft" />
          </span>
        </div>
      </motion.div>

      <motion.a
        href="#world"
        aria-label="Scroll to begin"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-7 flex flex-col items-center gap-1 text-xs font-semibold text-ink-faint"
      >
        Scroll to begin the journey
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="size-5" />
        </motion.span>
      </motion.a>
    </section>
  );
}
