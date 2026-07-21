"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Inbox,
  MapPin,
  Package,
  Pill,
  Stethoscope,
  Zap,
} from "lucide-react";
import type { PharmacyOrderView } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { orderRef } from "@/lib/data/pharmacy-source";
import { claimOrderAction } from "@/app/pharmacy/(console)/actions";
import { EmptyState, StatusPill, elapsed } from "@/components/pharmacy/console-ui";

const ease = [0.22, 1, 0.36, 1] as const;

function LineSummary({ items }: { items: PharmacyOrderView["items"] }) {
  const shown = items.slice(0, 3);
  const rest = items.length - shown.length;
  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {shown.map((i) => (
        <li key={i.id} className="flex items-baseline gap-2 text-xs">
          <Pill className="size-3 shrink-0 translate-y-0.5 text-ink-faint" />
          <span className="font-semibold text-ink">{i.drugName}</span>
          {i.strength && <span className="text-ink-soft">{i.strength}</span>}
          {i.frequency && (
            <span className="text-ink-faint">· {i.frequency}</span>
          )}
          {i.durationDays ? (
            <span className="text-ink-faint">· {i.durationDays}d</span>
          ) : null}
        </li>
      ))}
      {rest > 0 && (
        <li className="pl-5 text-xs text-ink-faint">+{rest} more line{rest > 1 ? "s" : ""}</li>
      )}
    </ul>
  );
}

/** An unclaimed order in the district pool — the "accept" surface. */
function PoolCard({ order, index }: { order: PharmacyOrderView; index: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept() {
    setError(null);
    start(async () => {
      const res = await claimOrderAction(order.id);
      if (!res.ok) setError(res.error ?? "Could not accept.");
      else router.push(`/pharmacy/orders/${order.id}`);
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ duration: 0.45, ease, delay: index * 0.05 }}
      className="scanline relative overflow-hidden rounded-2xl border border-hairline bg-panel p-4 glow-cyan"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="tnum font-mono text-xs font-semibold text-cyan">
            {orderRef(order.id)}
          </p>
          <p className="mt-1 truncate font-display text-base font-bold text-ink">
            {order.patientName}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-faint">
            <MapPin className="size-3 shrink-0" />
            {[order.patientVillage, order.patientDistrict]
              .filter(Boolean)
              .join(", ") || "Location not set"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <StatusPill status="routed" live />
          <p className="tnum mt-1.5 text-[11px] text-ink-faint">
            {elapsed(order.waitingMinutes)} ago
          </p>
        </div>
      </div>

      <LineSummary items={order.items} />

      <p className="mt-3 flex items-center gap-1.5 border-t border-hairline pt-3 text-[11px] text-ink-faint">
        <Stethoscope className="size-3" /> {order.doctorName}
        {order.doctorRegNo && <span>· {order.doctorRegNo}</span>}
      </p>

      {error && <p className="mt-2 text-xs font-medium text-red">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={accept}
          disabled={pending}
          className="flex-1 bg-cyan text-[#05080f] hover:bg-cyan/90"
        >
          <Zap className="size-4" />
          {pending ? "Accepting…" : "Accept order"}
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/pharmacy/orders/${order.id}`}>View</Link>
        </Button>
      </div>
    </motion.div>
  );
}

/** An order this pharmacy already holds. */
function ActiveCard({ order, index }: { order: PharmacyOrderView; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease, delay: index * 0.04 }}
    >
      <Link
        href={`/pharmacy/orders/${order.id}`}
        className="group block rounded-2xl border border-hairline bg-panel p-4 transition-colors hover:border-hairline-strong hover:bg-panel-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="tnum font-mono text-xs font-semibold text-ink-faint">
              {orderRef(order.id)}
            </p>
            <p className="mt-1 truncate font-display text-sm font-bold text-ink">
              {order.patientName}
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-faint">
              {order.items.length} line{order.items.length === 1 ? "" : "s"} ·{" "}
              {[order.patientVillage, order.patientDistrict]
                .filter(Boolean)
                .join(", ") || "—"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <StatusPill status={order.status} />
            <p className="tnum mt-1.5 text-[11px] text-ink-faint">
              {elapsed(order.waitingMinutes)}
            </p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-cyan opacity-0 transition-opacity group-hover:opacity-100">
          Open fulfilment <ArrowRight className="size-3" />
        </p>
      </Link>
    </motion.div>
  );
}

/**
 * The live board. Holds its own Supabase subscription and refetches on any
 * PharmacyOrder change, so a newly routed prescription lands here without a
 * page refresh — and disappears the instant another pharmacy claims it.
 */
export function OrderBoard({
  pool,
  active,
}: {
  pool: PharmacyOrderView[];
  active: PharmacyOrderView[];
}) {
  const router = useRouter();
  const audioRef = useRef<AudioContext | null>(null);
  const seenRef = useRef<Set<string> | null>(null);

  // Rendered straight from props: router.refresh() re-runs the server component
  // and hands down fresh data, so mirroring into state would only add a frame
  // of staleness (and a cascading render).

  const refresh = useCallback(() => {
    // The server components own the query (and the RLS join shape); re-running
    // them is cheaper than duplicating that select on the client.
    router.refresh();
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | undefined;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      // postgres_changes is RLS-filtered; without the JWT every event is dropped.
      if (session) supabase.realtime.setAuth(session.access_token);
      channel = supabase
        .channel(`nirog-rx-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "PharmacyOrder" },
          () => refresh()
        )
        .subscribe();
    })();
    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refresh]);

  // Chime on a genuinely new pool arrival. The null seed means the first pass
  // only records what is already there — arriving at a busy console must not
  // fire the alert for orders that were waiting before you opened it.
  useEffect(() => {
    const ids = new Set(pool.map((o) => o.id));
    const previous = seenRef.current;
    seenRef.current = ids;
    if (previous === null) return;
    if (pool.some((o) => !previous.has(o.id))) chime(audioRef);
  }, [pool]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <section>
        <header className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ink">
            Incoming
          </h2>
          <span className="tnum rounded-full bg-soft-cyan px-2 py-0.5 text-[11px] font-bold text-cyan">
            {pool.length}
          </span>
          <span className="ml-auto text-[11px] text-ink-faint">
            District pool · first to accept
          </span>
        </header>

        {pool.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No incoming prescriptions"
            body="When a Nirog clinician files a prescription for a patient in your district, it appears here instantly."
          />
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {pool.map((o, i) => (
                <PoolCard key={o.id} order={o} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section>
        <header className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ink">
            In fulfilment
          </h2>
          <span className="tnum rounded-full bg-panel-2 px-2 py-0.5 text-[11px] font-bold text-ink-soft">
            {active.length}
          </span>
        </header>

        {active.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nothing in progress"
            body="Orders you accept move here — prepare, mark ready, dispatch and confirm delivery."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {active.map((o, i) => (
                <ActiveCard key={o.id} order={o} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

/** Two-tone arrival chime, synthesised so there's no audio asset to ship. */
function chime(ref: React.RefObject<AudioContext | null>) {
  try {
    ref.current ??= new (window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext)();
    const ctx = ref.current;
    if (!ctx) return;
    void ctx.resume();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.11, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.34);
    });
  } catch {
    // Autoplay policy — a missed chime must never break the board.
  }
}
