import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

const toneMap: Record<string, string> = {
  blue: "bg-soft-blue text-blue",
  green: "bg-soft-green text-green",
  amber: "bg-soft-amber text-amber",
  red: "bg-soft-red text-red",
  indigo: "bg-soft-indigo text-indigo",
  aria: "bg-soft-purple text-aria",
  neutral: "bg-secondary text-ink-soft",
};

/** Deterministic tint so a patient keeps the same colour across the app. */
function toneFor(name: string): string {
  const keys = Object.keys(toneMap).filter((k) => k !== "neutral");
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return keys[sum % keys.length];
}

export function Avatar({
  name,
  className,
  size = "default",
  tone,
}: {
  name: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  tone?: keyof typeof toneMap;
}) {
  const sizes = {
    sm: "size-8 text-[11px]",
    default: "size-10 text-sm",
    lg: "size-14 text-lg",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        toneMap[tone ?? toneFor(name)],
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
