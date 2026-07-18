"use client";

import { useRef } from "react";
import { motion, useSpring } from "motion/react";
import {
  Sparkles,
  TriangleAlert,
  Pill,
  BellRing,
  Radio,
  ShieldCheck,
  Video,
  Check,
  MapPin,
} from "lucide-react";
import { Parallax } from "@/components/landing/shared";

/**
 * The hero's living product visualization: the doctor workspace exploded into
 * layered glass widgets — patient profile, ARIA summary, red flags, vitals,
 * care timeline, prescription, follow-up — each on its own parallax plane that
 * drifts with the pointer. Built entirely from the product's design tokens.
 */
export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useSpring(0, { stiffness: 60, damping: 18 });
  const my = useSpring(0, { stiffness: 60, damping: 18 });

  function onMove(e: React.MouseEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - (r.left + r.width / 2)) / r.width);
    my.set((e.clientY - (r.top + r.height / 2)) / r.height);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative mx-auto hidden h-[500px] w-full max-w-[600px] sm:block sm:h-[560px]"
    >
      {/* ambient glow behind the composition */}
      <div className="absolute left-1/2 top-1/2 -z-10 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-3xl" />
      <div className="absolute right-[6%] top-[10%] -z-10 size-56 rounded-full bg-aria/15 blur-3xl" />
      <div className="absolute bottom-[8%] left-[4%] -z-10 size-56 rounded-full bg-blue/15 blur-3xl" />

      {/* ── deep plane: patient chart card ── */}
      <Parallax mx={mx} my={my} factor={-14} className="absolute left-1/2 top-1/2 w-[340px] -translate-x-1/2 -translate-y-1/2 sm:w-[380px]">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-panel shadow-float ring-1 ring-black/[0.03]">
          <div className="flex items-center gap-3 border-b border-hairline bg-panel-2 px-5 py-4">
            <span className="grid size-11 place-items-center rounded-full bg-soft-red text-sm font-bold text-red">
              RY
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-extrabold text-ink">
                Rahul Yadav <span className="font-sans text-xs font-medium text-ink-faint">50y</span>
              </p>
              <p className="flex items-center gap-1 text-[11px] text-ink-soft">
                <MapPin className="size-3" /> Sultanpur, Barabanki · Hindi
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-soft-green px-2 py-1 text-[10px] font-semibold text-green">
              <ShieldCheck className="size-3" /> Consent
            </span>
          </div>
          <div className="space-y-3 p-5">
            {/* vitals */}
            <div className="grid grid-cols-4 gap-2 rounded-xl bg-canvas p-2.5">
              {[
                ["SpO₂", "93%", "text-red"],
                ["Pulse", "104", "text-red"],
                ["BP", "158/96", "text-ink"],
                ["Temp", "98.4", "text-ink"],
              ].map(([l, v, c]) => (
                <div key={l} className="text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-ink-faint">{l}</p>
                  <p className={`tnum text-sm font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
            {/* care timeline */}
            <div className="flex items-center gap-1.5">
              {["Intake", "Review", "Consult", "Plan"].map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-1.5">
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full text-[8px] font-bold ${
                      i < 2 ? "bg-green text-white" : i === 2 ? "bg-blue text-white" : "bg-secondary text-ink-faint"
                    }`}
                  >
                    {i < 2 ? <Check className="size-2.5" /> : i + 1}
                  </span>
                  {i < 3 && <span className={`h-px flex-1 ${i < 2 ? "bg-green/50" : "bg-hairline-strong"}`} />}
                </div>
              ))}
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-2.5 text-xs font-semibold text-white">
              <Video className="size-3.5" /> Start consultation
            </button>
          </div>
        </div>
      </Parallax>

      {/* ── ARIA summary (top-right, purple) ── */}
      <Parallax mx={mx} my={my} factor={22} className="float-y absolute -right-2 top-2 w-60 sm:right-0 sm:top-6">
        <div className="rounded-2xl border border-aria/20 bg-white/90 p-4 shadow-float backdrop-blur">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-aria">
            <Sparkles className="size-3.5" /> ARIA summary
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink/85">
            Breathlessness for 2 days, worse lying flat. Chest pressure since morning.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-soft-purple">
              <div className="h-full w-[82%] rounded-full bg-aria" />
            </div>
            <span className="tnum text-[10px] font-semibold text-aria">82%</span>
          </div>
        </div>
      </Parallax>

      {/* ── red flags (left) ── */}
      <Parallax mx={mx} my={my} factor={30} className="absolute -left-2 top-[36%] sm:left-0">
        <div className="float-y rounded-2xl bg-white/90 p-3.5 shadow-float backdrop-blur" style={{ animationDelay: "-2s" }}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-red">Red flags</p>
          <div className="mt-2 flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-soft-red px-2 py-1 text-[10px] font-semibold text-red">
              <TriangleAlert className="size-3" /> Chest pressure
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-soft-red px-2 py-1 text-[10px] font-semibold text-red">
              <TriangleAlert className="size-3" /> Orthopnoea
            </span>
          </div>
        </div>
      </Parallax>

      {/* ── prescription preview (bottom-left) ── */}
      <Parallax mx={mx} my={my} factor={18} className="absolute -left-3 bottom-[10%] w-56 sm:left-2">
        <div className="float-y rounded-2xl bg-white/90 p-4 shadow-float backdrop-blur" style={{ animationDelay: "-4s" }}>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-blue">
            <Pill className="size-3.5" /> Prescription
          </p>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between rounded-lg bg-canvas px-2.5 py-1.5">
              <span className="text-[11px] font-semibold text-ink">Amlodipine 5mg</span>
              <span className="text-[9px] text-ink-faint">OD · 90d</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-canvas px-2.5 py-1.5">
              <span className="text-[11px] font-semibold text-ink">Furosemide 20mg</span>
              <span className="text-[9px] text-ink-faint">BD · 5d</span>
            </div>
          </div>
        </div>
      </Parallax>

      {/* ── follow-up (bottom-right) ── */}
      <Parallax mx={mx} my={my} factor={26} className="absolute -right-1 bottom-[16%] sm:right-4">
        <div className="float-y rounded-2xl bg-white/90 px-4 py-3 shadow-float backdrop-blur" style={{ animationDelay: "-3s" }}>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <BellRing className="size-3.5 text-amber" /> Follow-up in 7 days
          </p>
          <p className="mt-0.5 text-[10px] text-ink-faint">Reminder sent to patient app</p>
        </div>
      </Parallax>

      {/* ── floating metric pills ── */}
      <Parallax mx={mx} my={my} factor={36} className="absolute right-[18%] top-[46%]">
        <span className="float-y inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-green shadow-float backdrop-blur" style={{ animationDelay: "-1.5s" }}>
          <Radio className="size-3" /> Live queue
        </span>
      </Parallax>
      <Parallax mx={mx} my={my} factor={32} className="absolute left-[30%] top-[6%]">
        <span className="float-y inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white shadow-float" style={{ animationDelay: "-5s" }}>
          2 waiting · 1 urgent
        </span>
      </Parallax>
    </div>
  );
}

/**
 * Phone variant: the same widgets as a calm, non-overlapping stack — no
 * absolute positioning, no parallax, minimal blur. Rendered below `sm`.
 */
export function HeroVisualMobile() {
  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {/* patient chart */}
      <div className="overflow-hidden rounded-2xl border border-white/70 bg-panel shadow-lift">
        <div className="flex items-center gap-3 border-b border-hairline bg-panel-2 px-4 py-3.5">
          <span className="grid size-10 place-items-center rounded-full bg-soft-red text-sm font-bold text-red">
            RY
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-extrabold text-ink">
              Rahul Yadav <span className="font-sans text-xs font-medium text-ink-faint">50y</span>
            </p>
            <p className="text-[11px] text-ink-soft">Sultanpur, Barabanki · Hindi</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-soft-green px-2 py-1 text-[10px] font-semibold text-green">
            <ShieldCheck className="size-3" /> Consent
          </span>
        </div>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-4 gap-2 rounded-xl bg-canvas p-2.5">
            {[
              ["SpO₂", "93%", "text-red"],
              ["Pulse", "104", "text-red"],
              ["BP", "158/96", "text-ink"],
              ["Temp", "98.4", "text-ink"],
            ].map(([l, v, c]) => (
              <div key={l} className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-ink-faint">{l}</p>
                <p className={`tnum text-sm font-bold ${c}`}>{v}</p>
              </div>
            ))}
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-2.5 text-xs font-semibold text-white">
            <Video className="size-3.5" /> Start consultation
          </button>
        </div>
      </div>

      {/* ARIA summary */}
      <div className="rounded-2xl border border-aria/20 bg-white p-4 shadow-quiet">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-aria">
          <Sparkles className="size-3.5" /> ARIA summary
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink/85">
          Breathlessness for 2 days, worse lying flat. Chest pressure since morning.
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-soft-purple">
            <div className="h-full w-[82%] rounded-full bg-aria" />
          </div>
          <span className="tnum text-[10px] font-semibold text-aria">82%</span>
        </div>
      </div>

      {/* pills row */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-soft-red px-3 py-1.5 text-[11px] font-semibold text-red shadow-quiet">
          <TriangleAlert className="size-3" /> Chest pressure
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-green shadow-quiet">
          <Radio className="size-3" /> Live queue
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-ink shadow-quiet">
          <BellRing className="size-3 text-amber" /> Follow-up in 7 days
        </span>
      </div>
    </div>
  );
}
