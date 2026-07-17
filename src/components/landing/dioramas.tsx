"use client";

import {
  Mic,
  Sparkles,
  TriangleAlert,
  Video,
  Signal,
  Pill,
  CalendarClock,
  Check,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";

/*
  Diorama "props": floating compositions built from the real product UI, so the
  landing world is made of the same material as the workspace. Each is centre-
  composed so a future 9:16 crop (or Higgsfield reframe) still reads.
*/

function Float({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`absolute ${className}`}
      style={{ animation: `bob 6s ease-in-out ${delay}s infinite` }}
    >
      {children}
    </div>
  );
}

/** 01 — Intake: a phone hearing a voice, symptoms forming. */
export function IntakeDiorama() {
  return (
    <div className="relative size-full">
      {/* Phone */}
      <div className="absolute left-1/2 top-1/2 w-[236px] -translate-x-1/2 -translate-y-1/2 rounded-[2.2rem] border border-hairline bg-panel p-3 shadow-float">
        <div className="rounded-[1.6rem] bg-canvas p-4">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-soft-purple text-aria">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-ink">ARIA</p>
              <p className="text-[10px] text-ink-soft">Listening · Hindi</p>
            </div>
          </div>
          <div className="mt-4 flex h-12 items-center justify-center gap-[3px]">
            {[10, 22, 34, 20, 40, 16, 30, 24, 38, 14, 26, 18].map((h, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-aria/70"
                style={{
                  height: h,
                  animation: `wave 1.1s ease-in-out ${i * 0.08}s infinite`,
                }}
              />
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="rounded-lg bg-panel px-2.5 py-1.5 text-[10px] text-ink-soft shadow-quiet">
              &ldquo;Saans phoolti hai, do din se…&rdquo;
            </div>
          </div>
        </div>
      </div>

      <Float className="left-[6%] top-[18%]" delay={0.4}>
        <span className="rounded-full bg-soft-purple px-3 py-1.5 text-xs font-medium text-aria shadow-quiet">
          Breathlessness
        </span>
      </Float>
      <Float className="right-[4%] top-[30%]" delay={1.1}>
        <span className="rounded-full bg-panel px-3 py-1.5 text-xs font-medium text-ink shadow-quiet">
          2 days
        </span>
      </Float>
      <Float className="bottom-[16%] right-[10%]" delay={0.7}>
        <span className="inline-flex items-center gap-1 rounded-full bg-soft-red px-3 py-1.5 text-xs font-medium text-red shadow-quiet">
          <TriangleAlert className="size-3" /> Chest pressure
        </span>
      </Float>
      <Float className="bottom-[22%] left-[8%]" delay={1.5}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-xs font-medium text-ink shadow-quiet">
          <Mic className="size-3 text-aria" /> Voice-first
        </span>
      </Float>
    </div>
  );
}

/** 02 — Triage: ARIA hands the structured summary to a clinician's queue. */
export function TriageDiorama() {
  return (
    <div className="relative size-full">
      <div className="absolute left-1/2 top-1/2 w-[300px] -translate-x-1/2 -translate-y-1/2 space-y-2.5">
        <div className="rounded-2xl border border-aria/25 bg-panel p-3.5 shadow-float">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-aria">
            <Sparkles className="size-3.5" /> ARIA HANDOVER
          </div>
          <p className="mt-1.5 text-sm font-semibold text-ink">
            Breathlessness for 2 days
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-soft-red px-2 py-0.5 text-[10px] font-medium text-red">
              <TriangleAlert className="size-2.5" /> Chest pressure
            </span>
            <span className="rounded-md bg-soft-purple px-2 py-0.5 text-[10px] font-medium text-aria">
              SpO₂ 93%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-red/20 bg-panel p-3 shadow-lift ring-1 ring-red/15">
          <span className="h-9 w-1 rounded-full bg-red" />
          <span className="grid size-9 place-items-center rounded-full bg-soft-red text-sm font-semibold text-red">
            RY
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Rahul Yadav</p>
            <p className="text-[11px] text-red">Emergency · waiting 14m</p>
          </div>
          <span className="rounded-full bg-soft-red px-2 py-0.5 text-[10px] font-semibold text-red">
            Now
          </span>
        </div>
      </div>

      <Float className="left-[6%] top-[26%]" delay={0.6}>
        <div className="flex items-center gap-2 rounded-xl bg-panel px-3 py-2 shadow-quiet">
          <span className="grid size-7 place-items-center rounded-full bg-soft-amber text-xs font-semibold text-amber">
            SD
          </span>
          <span className="text-[11px] text-ink-soft">Follow-up · 10:30</span>
        </div>
      </Float>
      <Float className="bottom-[20%] right-[6%]" delay={1.2}>
        <div className="flex items-center gap-2 rounded-xl bg-panel px-3 py-2 shadow-quiet">
          <span className="grid size-7 place-items-center rounded-full bg-soft-green text-xs font-semibold text-green">
            AY
          </span>
          <span className="text-[11px] text-ink-soft">Pediatrics · 11:00</span>
        </div>
      </Float>
    </div>
  );
}

/** 03 — Consult: a live call that degrades gracefully to audio. */
export function ConsultDiorama() {
  return (
    <div className="relative size-full">
      <div className="absolute left-1/2 top-1/2 w-[290px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-hairline bg-ink shadow-float">
        <div className="relative grid aspect-video place-items-center bg-[radial-gradient(120%_100%_at_50%_0%,#2a2a30_0%,#0c0c0e_70%)]">
          <div className="flex flex-col items-center gap-2 text-white/80">
            <span className="grid size-14 place-items-center rounded-full bg-soft-red text-lg font-semibold text-red">
              RY
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red/90 px-2.5 py-0.5 text-[10px] font-medium text-white">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              LIVE 04:12
            </span>
          </div>
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-medium text-amber backdrop-blur">
            <Signal className="size-3" /> Fair network
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 py-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-white/10 text-white">
            <Mic className="size-4" />
          </span>
          <span className="grid size-8 place-items-center rounded-full bg-white/10 text-white">
            <Video className="size-4" />
          </span>
          <span className="grid size-8 place-items-center rounded-full bg-red text-white">
            <HeartPulse className="size-4" />
          </span>
        </div>
      </div>

      <Float className="right-[4%] top-[24%]" delay={0.9}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-xs font-medium text-ink shadow-quiet">
          <Signal className="size-3 text-amber" /> Downgrades to audio
        </span>
      </Float>
      <Float className="bottom-[18%] left-[6%]" delay={1.4}>
        <span className="rounded-full bg-soft-green px-3 py-1.5 text-xs font-medium text-green shadow-quiet">
          Resumable
        </span>
      </Float>
    </div>
  );
}

/** 04 — Care plan: prescription + follow-up, filed and sent back. */
export function CarePlanDiorama() {
  return (
    <div className="relative size-full">
      <div className="absolute left-1/2 top-1/2 w-[280px] -translate-x-1/2 -translate-y-1/2 space-y-2.5">
        <div className="rounded-2xl border border-hairline bg-panel p-3.5 shadow-float">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue">
            <Pill className="size-3.5" /> PRESCRIPTION
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between rounded-lg bg-panel-2 px-2.5 py-1.5">
              <span className="text-xs font-medium text-ink">Amlodipine 5mg</span>
              <span className="text-[10px] text-ink-soft">1 · OD · 90d</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-panel-2 px-2.5 py-1.5">
              <span className="text-xs font-medium text-ink">Salbutamol</span>
              <span className="text-[10px] text-ink-soft">PRN</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber/25 bg-panel p-3 shadow-lift">
          <span className="grid size-9 place-items-center rounded-full bg-soft-amber text-amber">
            <CalendarClock className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-ink">Follow-up in 7 days</p>
            <p className="text-[11px] text-ink-soft">Video · review BP diary</p>
          </div>
        </div>
      </div>

      <Float className="left-[7%] top-[22%]" delay={0.5}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-soft-green px-3 py-1.5 text-xs font-medium text-green shadow-quiet">
          <Check className="size-3" /> Filed &amp; signed
        </span>
      </Float>
      <Float className="bottom-[20%] right-[7%]" delay={1.1}>
        <span className="rounded-full bg-panel px-3 py-1.5 text-xs font-medium text-ink shadow-quiet">
          Medicines &amp; tests
        </span>
      </Float>
    </div>
  );
}

/** 05 — Continuity: the loop closes; consent + audit hold it together. */
export function ContinuityDiorama() {
  const nodes = [
    { label: "Intake", tone: "text-aria bg-soft-purple", angle: -90 },
    { label: "Triage", tone: "text-blue bg-soft-blue", angle: -18 },
    { label: "Consult", tone: "text-green bg-soft-green", angle: 54 },
    { label: "Care plan", tone: "text-amber bg-soft-amber", angle: 126 },
    { label: "Follow-up", tone: "text-red bg-soft-red", angle: 198 },
  ];
  const R = 118;
  return (
    <div className="relative size-full">
      <div className="absolute left-1/2 top-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2">
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed border-hairline-strong"
          style={{ animation: "spin-slow 40s linear infinite" }}
        />
        <div className="absolute left-1/2 top-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-ink text-center shadow-float">
          <HeartPulse className="size-6 text-lblue" />
          <span className="mt-1 text-[10px] font-semibold text-white">
            One episode
          </span>
        </div>
        {nodes.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = Math.cos(rad) * R;
          const y = Math.sin(rad) * R;
          return (
            <span
              key={n.label}
              className={`absolute left-1/2 top-1/2 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-quiet ${n.tone}`}
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
            >
              {n.label}
            </span>
          );
        })}
      </div>

      <Float className="left-[8%] top-[24%]" delay={0.6}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-xs font-medium text-ink shadow-quiet">
          <ShieldCheck className="size-3 text-green" /> Consent-gated
        </span>
      </Float>
      <Float className="bottom-[22%] right-[8%]" delay={1.3}>
        <span className="rounded-full bg-panel px-3 py-1.5 text-xs font-medium text-ink shadow-quiet">
          Every access audited
        </span>
      </Float>
    </div>
  );
}
