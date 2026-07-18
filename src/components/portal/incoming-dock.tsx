"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Radio,
  TriangleAlert,
  Video,
  Phone,
  MessageSquare,
  Loader2,
  PhoneIncoming,
} from "lucide-react";
import type { QueueItemView } from "@/lib/data/source";
import {
  setOnCallAction,
  heartbeatAction,
  claimQueueAction,
} from "@/app/portal/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Minimal shape the dock renders — matches the pool RLS visibility (no PII). */
type PoolItem = Pick<
  QueueItemView,
  "id" | "triage" | "channel" | "reason" | "redFlagCount"
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPoolRow(q: any): PoolItem {
  return {
    id: q.id,
    triage: q.triage,
    channel: q.channel,
    reason: q.reason || q.handover?.chiefComplaint || "New consult request",
    redFlagCount: q.handover?.redFlags?.length ?? 0,
  };
}

const CHANNEL_ICON = { video: Video, audio: Phone, chat: MessageSquare } as const;
const TRIAGE_TONE = {
  emergency: "bg-soft-red text-red",
  urgent: "bg-soft-amber text-amber",
  routine: "bg-soft-blue text-blue",
} as const;

/**
 * The on-demand matching surface. A doctor toggles "On call" to enter the
 * pool; unassigned patient requests then appear here live (with a chime) and
 * can be accepted with one tap. Accepting atomically claims the request and
 * opens the consultation — if another doctor got it first, it just clears.
 */
export function IncomingDock({
  initialOnCall,
  pool: initialPool,
}: {
  initialOnCall: boolean;
  pool: QueueItemView[];
}) {
  const router = useRouter();
  const [onCall, setOnCall] = useState(initialOnCall);
  const [pool, setPool] = useState<PoolItem[]>(initialPool.map(mapPoolRow));
  const [pendingToggle, startToggle] = useTransition();
  const [claiming, setClaiming] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set(initialPool.map((p) => p.id)));

  // Fetch the current pool directly (client-side, RLS-scoped). Self-contained
  // so it never depends on an RSC refresh reaching this component.
  const refetchPool = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("QueueEntry")
      .select("id,triage,channel,reason,handover:AriaHandover(redFlags,chiefComplaint)")
      .is("doctorId", null)
      .eq("state", "waiting");
    setPool((data ?? []).map(mapPoolRow));
  }, []);

  // While on call: subscribe to QueueEntry changes and refetch the pool. This
  // is the live "incoming patient" path — realtime delivers the pool insert
  // (RLS-permitted) and we refetch + chime.
  useEffect(() => {
    if (!onCall) return;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | undefined;
    void refetchPool();
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) supabase.realtime.setAuth(session.access_token);
      channel = supabase
        .channel(`nirog-pool-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "QueueEntry" },
          () => void refetchPool()
        )
        .subscribe();
    })();
    const beat = setInterval(() => void heartbeatAction(), 30_000);
    return () => {
      clearInterval(beat);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [onCall, refetchPool]);

  // Chime when a genuinely new request appears (not on the first render).
  useEffect(() => {
    if (!onCall) {
      prevIdsRef.current = new Set(pool.map((p) => p.id));
      return;
    }
    const fresh = pool.some((p) => !prevIdsRef.current.has(p.id));
    prevIdsRef.current = new Set(pool.map((p) => p.id));
    if (fresh) chime(audioCtxRef.current);
  }, [pool, onCall]);

  function toggle() {
    const next = !onCall;
    // Prime the AudioContext on this user gesture so the chime can play later.
    if (next && !audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).webkitAudioContext)();
      } catch {}
    }
    void audioCtxRef.current?.resume();
    setOnCall(next);
    if (!next) setPool([]);
    startToggle(async () => {
      await setOnCallAction(next);
      router.refresh();
    });
  }

  async function accept(queueId: string) {
    setClaiming(queueId);
    try {
      const res = await claimQueueAction(queueId);
      if (res.claimed) {
        router.push(`/portal/consult/${queueId}`);
      } else {
        // Lost the race — another doctor took it. Refresh clears the card.
        router.refresh();
        setClaiming(null);
      }
    } catch {
      setClaiming(null);
    }
  }

  return (
    <section
      className={cn(
        "rounded-2xl border bg-panel p-4 shadow-quiet transition-colors",
        onCall ? "border-green/40" : "border-hairline"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid size-9 place-items-center rounded-full transition-colors",
              onCall ? "bg-soft-green text-green" : "bg-secondary text-ink-faint"
            )}
          >
            <PhoneIncoming className="size-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">
              {onCall ? "On call — accepting patients" : "Off call"}
            </p>
            <p className="text-xs text-ink-soft">
              {onCall
                ? "Incoming consult requests appear here live."
                : "Go on call to receive on-demand consults."}
            </p>
          </div>
        </div>

        {/* on-call switch */}
        <button
          type="button"
          role="switch"
          aria-checked={onCall}
          aria-label="Toggle on-call availability"
          onClick={toggle}
          disabled={pendingToggle}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
            onCall ? "bg-green" : "bg-secondary"
          )}
        >
          <span
            className={cn(
              "inline-block size-5 rounded-full bg-white shadow transition-transform",
              onCall ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {/* incoming requests */}
      {onCall && (
        <div className="mt-3">
          {pool.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-3 text-xs text-ink-soft">
              <Radio className="size-3.5 animate-pulse text-green" />
              Waiting for incoming patients…
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {pool.map((item) => {
                const Icon = CHANNEL_ICON[item.channel];
                const busy = claiming === item.id;
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-hairline bg-canvas p-2.5"
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-lg",
                        TRIAGE_TONE[item.triage]
                      )}
                    >
                      {item.triage === "emergency" ? (
                        <TriangleAlert className="size-4.5" />
                      ) : (
                        <Icon className="size-4.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {item.reason}
                      </p>
                      <p className="flex items-center gap-2 text-[11px] text-ink-soft">
                        <span className="font-medium capitalize">{item.triage}</span>
                        <span aria-hidden>·</span>
                        <span className="capitalize">{item.channel}</span>
                        {item.redFlagCount > 0 && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-0.5 text-red">
                              <TriangleAlert className="size-3" />
                              {item.redFlagCount} red flag
                              {item.redFlagCount > 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => accept(item.id)}
                      disabled={busy}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-green px-4 text-xs font-semibold text-white transition-transform active:scale-95 disabled:opacity-70"
                    >
                      {busy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <PhoneIncoming className="size-4" />
                      )}
                      {busy ? "Connecting…" : "Accept"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/** A short two-note chime synthesized on the fly — no audio asset needed. */
function chime(ctx: AudioContext | null) {
  if (!ctx) return;
  const now = ctx.currentTime;
  [880, 1174.7].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = now + i * 0.16;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  });
}
