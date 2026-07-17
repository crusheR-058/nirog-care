import { ShieldCheck } from "lucide-react";
import type { AuditEvent } from "@/lib/domain/types";

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

export function TrustLog({ events }: { events: AuditEvent[] }) {
  return (
    <ol className="relative flex flex-col gap-4 pl-1">
      {events.map((e, i) => (
        <li key={e.id} className="relative flex gap-3">
          <div className="flex flex-col items-center">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-soft-green text-green">
              <ShieldCheck className="size-3.5" />
            </span>
            {i < events.length - 1 && (
              <span className="mt-1 w-px flex-1 bg-hairline" />
            )}
          </div>
          <div className="min-w-0 pb-1">
            <p className="text-sm text-ink">
              <span className="font-medium">{e.action}</span>
              {" · "}
              <span className="text-ink-soft">{e.target}</span>
            </p>
            {e.reason && (
              <p className="text-xs text-ink-faint">Reason: {e.reason}</p>
            )}
            <p className="text-xs text-ink-faint">
              {e.actorName} · {timeAgo(e.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
