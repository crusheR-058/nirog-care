import Link from "next/link";
import { Sparkles, ArrowRight, HeartPulse } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RedFlags, TriageBadge } from "@/components/portal/clinical";
import type { AriaHandover, Patient } from "@/lib/domain/types";

/**
 * The signature element: ARIA's top-priority AI intake, surfaced as a distinct
 * purple "glass" card that hands off directly into the consult. Always labelled
 * unverified — the doctor decides.
 */
export function AriaSpotlight({
  patient,
  handover,
  queueId,
}: {
  patient: Patient;
  handover: AriaHandover;
  queueId: string;
}) {
  const v = handover.vitals;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-aria/20 bg-soft-purple p-5 shadow-quiet">
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-aria/10 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-aria">
          <Sparkles className="size-3.5" /> Needs you now
        </span>
        <TriageBadge level={handover.suggestedTriage} size="sm" />
      </div>

      <div className="relative mt-4 flex items-center gap-3">
        <Avatar name={patient.fullName} tone="red" size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-ink">
            {patient.fullName}
          </p>
          <p className="truncate text-sm text-ink-soft">
            {handover.chiefComplaint} · {handover.durationText}
          </p>
        </div>
      </div>

      <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-ink/80">
        {handover.narrative}
      </p>

      <div className="relative mt-3">
        <RedFlags flags={handover.redFlags} />
      </div>

      {v && (
        <div className="relative mt-4 grid grid-cols-4 gap-2 rounded-xl bg-panel/70 p-2.5">
          <Vital label="SpO₂" value={v.spo2} unit="%" alert={(v.spo2 ?? 100) < 95} />
          <Vital label="Pulse" value={v.pulseBpm} unit="bpm" alert={(v.pulseBpm ?? 0) > 100} />
          <Vital
            label="BP"
            value={v.systolic ? `${v.systolic}/${v.diastolic}` : undefined}
            alert={(v.systolic ?? 0) >= 150}
          />
          <Vital label="Resp" value={v.respRate} unit="/m" alert={(v.respRate ?? 0) > 20} />
        </div>
      )}

      <Button asChild variant="aria" className="relative mt-4 w-full">
        <Link href={`/portal/consult/${queueId}`}>
          <HeartPulse className="size-4" /> Review &amp; start consult
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

function Vital({
  label,
  value,
  unit,
  alert,
}: {
  label: string;
  value?: number | string;
  unit?: string;
  alert?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p
        className={`tnum text-sm font-semibold ${alert ? "text-red" : "text-ink"}`}
      >
        {value ?? "—"}
        {value != null && unit ? (
          <span className="text-[10px] font-normal text-ink-faint">{unit}</span>
        ) : null}
      </p>
    </div>
  );
}
