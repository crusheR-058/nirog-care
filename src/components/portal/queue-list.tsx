"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, CheckCircle2, CalendarClock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  TriageBadge,
  ChannelBadge,
  ConnectionDot,
} from "@/components/portal/clinical";
import type { QueueItemView } from "@/lib/data/source";
import { KIND } from "@/lib/domain/labels";
import { cn, formatTime, minutesSince } from "@/lib/utils";

function WaitClock({
  checkedInAt,
  initialMinutes,
}: {
  checkedInAt: string;
  initialMinutes: number;
}) {
  // Seed with the server-computed value so SSR and hydration agree, then tick
  // live from the client clock.
  const [mins, setMins] = useState(initialMinutes);
  useEffect(() => {
    const tick = () => setMins(minutesSince(checkedInAt));
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, [checkedInAt]);

  const urgent = mins >= 10;
  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-1 text-xs font-medium",
        urgent ? "text-red" : "text-ink-soft"
      )}
    >
      <Clock className="size-3.5" /> waiting {mins}m
    </span>
  );
}

function QueueCard({ item, index }: { item: QueueItemView; index: number }) {
  const isDone = item.state === "completed";
  const isScheduled = item.state === "scheduled";
  const href =
    item.state === "waiting"
      ? `/portal/consult/${item.id}`
      : `/portal/patients/${item.patientId}`;

  return (
    <Link
      href={href}
      style={{ animationDelay: `${index * 45}ms` }}
      className={cn(
        "queue-card group flex items-center gap-3.5 rounded-2xl border border-hairline bg-panel p-3.5 shadow-quiet transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:-translate-y-0.5",
        item.triage === "emergency" &&
          !isDone &&
          "ring-1 ring-red/25 border-red/20",
        isDone && "opacity-60"
      )}
    >
      {/* triage spine */}
      <span
        className={cn(
          "h-12 w-1 shrink-0 rounded-full",
          item.triage === "emergency"
            ? "bg-red"
            : item.triage === "urgent"
              ? "bg-amber"
              : "bg-green"
        )}
      />

      <Avatar name={item.patientName} tone={item.patientAvatarTone as never} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-ink">{item.patientName}</p>
          <span className="tnum text-xs text-ink-faint">
            {item.patientAge}y
          </span>
        </div>
        <p className="truncate text-sm text-ink-soft">{item.reason}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-[11px] font-medium text-ink-faint">
            {KIND[item.kind]}
          </span>
          {item.state === "waiting" && (
            <WaitClock
              checkedInAt={item.checkedInAt}
              initialMinutes={item.waitingMinutes}
            />
          )}
          {isScheduled && (
            <span className="tnum inline-flex items-center gap-1 text-xs text-ink-soft">
              <CalendarClock className="size-3.5" />
              {formatTime(item.scheduledFor)}
            </span>
          )}
          {isDone && (
            <span className="inline-flex items-center gap-1 text-xs text-green">
              <CheckCircle2 className="size-3.5" /> Completed
            </span>
          )}
          {item.connectionQuality !== "good" && item.state === "waiting" && (
            <ConnectionDot quality={item.connectionQuality} />
          )}
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
        <div className="flex items-center gap-1.5">
          {item.redFlagCount > 0 && !isDone && (
            <span className="inline-flex items-center gap-1 rounded-md bg-soft-red px-1.5 py-0.5 text-[11px] font-semibold text-red">
              {item.redFlagCount} red flag{item.redFlagCount > 1 ? "s" : ""}
            </span>
          )}
          <TriageBadge level={item.triage} size="sm" />
        </div>
        <ChannelBadge channel={item.channel} />
      </div>

      {item.state === "waiting" ? (
        <Button
          size="sm"
          variant={item.triage === "emergency" ? "danger" : "primary"}
          className="ml-1 hidden shrink-0 md:inline-flex"
          asChild
        >
          <span>Start</span>
        </Button>
      ) : (
        <ChevronRight className="ml-1 size-5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
      )}
    </Link>
  );
}

export function QueueList({ items }: { items: QueueItemView[] }) {
  if (items.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-hairline-strong bg-panel/50 py-14 text-center">
        <p className="text-sm font-medium text-ink">The queue is clear</p>
        <p className="mt-1 text-sm text-ink-soft">
          New intakes from ARIA will appear here.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <QueueCard key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}
