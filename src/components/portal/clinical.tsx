import { Video, Phone, MessageSquare, TriangleAlert, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ConsultChannel, TriageLevel } from "@/lib/domain/types";
import { CHANNEL, TRIAGE, CONNECTION } from "@/lib/domain/labels";

export function TriageBadge({
  level,
  size = "default",
}: {
  level: TriageLevel;
  size?: "sm" | "default" | "lg";
}) {
  const t = TRIAGE[level];
  return (
    <Badge tone={t.tone} size={size}>
      {level === "emergency" && <TriangleAlert />}
      {t.label}
    </Badge>
  );
}

const channelIcon = { video: Video, audio: Phone, chat: MessageSquare };

export function ChannelBadge({ channel }: { channel: ConsultChannel }) {
  const Icon = channelIcon[channel];
  const c = CHANNEL[channel];
  return (
    <Badge tone={c.tone} size="sm">
      <Icon /> {c.label}
    </Badge>
  );
}

export function ConnectionDot({
  quality,
}: {
  quality: "good" | "fair" | "poor";
}) {
  const c = CONNECTION[quality];
  const color = {
    good: "text-green",
    fair: "text-amber",
    poor: "text-red",
  }[quality];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-ink-soft"
      title={c.label}
    >
      <Wifi className={cn("size-3.5", color)} /> {c.label}
    </span>
  );
}

/** ARIA red-flag chips — deterministic escalation signals from AI intake. */
export function RedFlags({ flags }: { flags: string[] }) {
  if (flags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((f) => (
        <span
          key={f}
          className="inline-flex items-center gap-1 rounded-md bg-soft-red px-2 py-1 text-[11px] font-medium text-red"
        >
          <TriangleAlert className="size-3" /> {f}
        </span>
      ))}
    </div>
  );
}

/** Confidence meter for ARIA's AI intake — always framed as unverified. */
export function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-aria"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tnum text-xs text-ink-soft">{pct}% AI confidence</span>
    </div>
  );
}
