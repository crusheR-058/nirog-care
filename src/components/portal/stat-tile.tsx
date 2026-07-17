import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const accents = {
  blue: "text-blue bg-soft-blue",
  red: "text-red bg-soft-red",
  amber: "text-amber bg-soft-amber",
  green: "text-green bg-soft-green",
  indigo: "text-indigo bg-soft-indigo",
} as const;

export function StatTile({
  label,
  value,
  unit,
  icon: Icon,
  accent = "blue",
  hint,
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  accent?: keyof typeof accents;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-panel p-4 shadow-quiet">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-ink-soft">{label}</span>
        <span
          className={cn("grid size-7 place-items-center rounded-lg", accents[accent])}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="tnum text-3xl font-semibold tracking-tight text-ink">
          {value}
        </span>
        {unit && <span className="text-sm text-ink-faint">{unit}</span>}
      </div>
      {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
