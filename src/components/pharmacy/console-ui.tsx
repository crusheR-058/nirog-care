"use client";

import { motion } from "motion/react";
import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  PackageCheck,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { OrderStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export const STATUS_STYLE: Record<
  OrderStatus,
  { label: string; icon: LucideIcon; text: string; bg: string; dot: string }
> = {
  routed: {
    label: "Incoming",
    icon: CircleDashed,
    text: "text-cyan",
    bg: "bg-soft-cyan",
    dot: "bg-cyan",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    text: "text-blue",
    bg: "bg-soft-blue",
    dot: "bg-blue",
  },
  preparing: {
    label: "Preparing",
    icon: Clock3,
    text: "text-amber",
    bg: "bg-soft-amber",
    dot: "bg-amber",
  },
  ready: {
    label: "Ready",
    icon: PackageCheck,
    text: "text-indigo",
    bg: "bg-soft-indigo",
    dot: "bg-indigo",
  },
  dispatched: {
    label: "Out for delivery",
    icon: Truck,
    text: "text-aria",
    bg: "bg-soft-purple",
    dot: "bg-aria",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    text: "text-green",
    bg: "bg-soft-green",
    dot: "bg-green",
  },
  rejected: {
    label: "Declined",
    icon: XCircle,
    text: "text-red",
    bg: "bg-soft-red",
    dot: "bg-red",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    text: "text-ink-faint",
    bg: "bg-panel-2",
    dot: "bg-ink-faint",
  },
};

export function StatusPill({
  status,
  live = false,
  className,
}: {
  status: OrderStatus;
  live?: boolean;
  className?: string;
}) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        s.bg,
        s.text,
        className
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", s.dot, live && "live-dot")}
      />
      {s.label}
    </span>
  );
}

/** A single metric in the command-centre header row. */
export function StatTile({
  label,
  value,
  hint,
  accent = "cyan",
  index = 0,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "cyan" | "blue" | "amber" | "green" | "aria";
  index?: number;
}) {
  const accents = {
    cyan: "text-cyan",
    blue: "text-blue",
    amber: "text-amber",
    green: "text-green",
    aria: "text-aria",
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease, delay: index * 0.06 }}
      className="relative overflow-hidden rounded-2xl border border-hairline bg-panel p-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
        {label}
      </p>
      <p
        className={cn(
          "tnum mt-2 font-display text-3xl font-extrabold leading-none",
          accents[accent]
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>}
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline-strong bg-panel/50 px-6 py-14 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-panel-2 text-ink-faint">
        <Icon className="size-6" />
      </span>
      <p className="mt-4 font-display text-sm font-bold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-faint">
        {body}
      </p>
    </div>
  );
}

/** "4 min" / "2 h 10 m" — the SLA clock on an order. */
export function elapsed(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m ? `${h} h ${m} m` : `${h} h`;
  return `${Math.floor(h / 24)} d`;
}
