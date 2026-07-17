import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Minutes elapsed since an ISO timestamp, floored, never negative. */
export function minutesSince(iso: string, now: Date = new Date()): number {
  const diff = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  return Math.max(0, diff);
}

/** "04:12" style waiting clock from an ISO check-in time. */
export function waitClock(iso: string, now: Date = new Date()): string {
  const total = minutesSince(iso, now);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}h` : `${m} min`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// Pin to IST so server (often UTC) and client render identical strings —
// otherwise locale/timezone differences cause React hydration mismatches.
const IST = "Asia/Kolkata";

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: IST,
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: IST,
  });
}
