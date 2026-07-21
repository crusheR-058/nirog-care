"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import type { OrderStatus, PharmacyOrderView } from "@/lib/domain/types";
import { ORDER_TRANSITIONS } from "@/lib/data/pharmacy-source";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS_STYLE } from "@/components/pharmacy/console-ui";
import {
  advanceOrderAction,
  claimOrderAction,
} from "@/app/pharmacy/(console)/actions";

const ease = [0.22, 1, 0.36, 1] as const;

/** The happy path, in order — rendered as a progress spine. */
const TRACK: OrderStatus[] = [
  "routed",
  "accepted",
  "preparing",
  "ready",
  "dispatched",
  "delivered",
];

const CTA: Partial<Record<OrderStatus, string>> = {
  accepted: "Accept order",
  preparing: "Start preparing",
  ready: "Mark ready",
  dispatched: "Dispatch for delivery",
  delivered: "Confirm delivered",
  rejected: "Decline",
  cancelled: "Cancel order",
};

export function FulfilmentPanel({ order }: { order: PharmacyOrderView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<OrderStatus | null>(null);

  const unclaimed = !order.pharmacyId && order.status === "routed";
  const next = (ORDER_TRANSITIONS[order.status] ?? []).filter(
    (s) => s !== "cancelled"
  );
  const forward = next.filter((s) => s !== "rejected");
  const canDecline = next.includes("rejected");

  const currentIdx = TRACK.indexOf(order.status);
  const terminal = order.status === "delivered";

  function run(to: OrderStatus, note?: string) {
    setError(null);
    setBusy(to);
    start(async () => {
      const res = unclaimed
        ? await claimOrderAction(order.id)
        : await advanceOrderAction({ orderId: order.id, next: to, note });
      setBusy(null);
      if (!res.ok) setError(res.error ?? "Could not update the order.");
      else {
        setDeclining(false);
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-hairline bg-panel p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ink">
        Fulfilment
      </h2>

      {/* progress spine */}
      <ol className="mt-4 flex flex-col gap-0">
        {TRACK.map((step, i) => {
          const done = currentIdx > i || terminal;
          const isNow = currentIdx === i && !terminal;
          const s = STATUS_STYLE[step];
          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <motion.span
                  initial={false}
                  animate={{ scale: isNow ? 1.12 : 1 }}
                  transition={{ duration: 0.35, ease }}
                  className={`grid size-7 shrink-0 place-items-center rounded-full border transition-colors ${
                    done
                      ? "border-transparent bg-green text-[#05080f]"
                      : isNow
                        ? `border-transparent ${s.bg} ${s.text}`
                        : "border-hairline-strong bg-panel-2 text-ink-faint"
                  }`}
                >
                  {done ? (
                    <Check className="size-3.5" />
                  ) : (
                    <s.icon className="size-3.5" />
                  )}
                </motion.span>
                {i < TRACK.length - 1 && (
                  <span
                    className={`w-px flex-1 ${
                      done ? "bg-green/50" : "bg-hairline"
                    }`}
                    style={{ minHeight: 22 }}
                  />
                )}
              </div>
              <div className="pb-4">
                <p
                  className={`text-sm font-semibold ${
                    isNow ? "text-ink" : done ? "text-ink-soft" : "text-ink-faint"
                  }`}
                >
                  {s.label}
                </p>
                {isNow && (
                  <p className="text-xs text-ink-faint">Current stage</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {error && (
        <p className="mb-3 flex items-start gap-2 rounded-xl bg-soft-red px-3 py-2 text-xs font-medium text-red">
          <AlertTriangle className="size-3.5 shrink-0 translate-y-px" />
          {error}
        </p>
      )}

      {terminal ? (
        <p className="rounded-xl bg-soft-green px-3 py-2.5 text-xs font-semibold text-green">
          Delivered{order.deliveredAt ? ` · ${new Date(order.deliveredAt).toLocaleString()}` : ""}.
          Settlement follows automatically.
        </p>
      ) : declining ? (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-ink" htmlFor="decline-reason">
            Why are you declining?
          </label>
          <Input
            id="decline-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Out of stock, cannot deliver to this village…"
          />
          <p className="text-[11px] text-ink-faint">
            The order returns to the district pool so another pharmacy can fulfil it.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => run("rejected", reason || "Declined")}
              disabled={pending}
              className="border-red/40 text-red hover:bg-soft-red"
            >
              {pending && busy === "rejected" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Confirm decline
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeclining(false)}
              disabled={pending}
            >
              Keep it
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {unclaimed ? (
            <Button
              onClick={() => run("accepted")}
              disabled={pending}
              className="bg-blue text-white hover:bg-blue-press"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Accept order
            </Button>
          ) : (
            forward.map((s) => (
              <Button
                key={s}
                onClick={() => run(s)}
                disabled={pending}
                className="bg-blue text-white hover:bg-blue-press"
              >
                {pending && busy === s && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {CTA[s] ?? s}
              </Button>
            ))
          )}
          {canDecline && !unclaimed && (
            <Button
              variant="ghost"
              onClick={() => setDeclining(true)}
              disabled={pending}
              className="text-ink-soft hover:text-red"
            >
              Decline
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
