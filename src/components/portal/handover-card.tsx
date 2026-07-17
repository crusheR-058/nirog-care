"use client";

import { useState, useTransition } from "react";
import { Sparkles, Check, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RedFlags,
  TriageBadge,
  ConfidenceMeter,
} from "@/components/portal/clinical";
import { acceptHandoverAction } from "@/app/portal/actions";
import type { AriaHandover } from "@/lib/domain/types";
import { formatTime } from "@/lib/utils";

/**
 * ARIA's AI intake, presented for clinician review. Everything here is
 * UNVERIFIED until the doctor accepts it — the pitch's core clinical control.
 */
export function HandoverCard({ handover }: { handover: AriaHandover }) {
  const [accepted, setAccepted] = useState(handover.verifiedByDoctor);
  const [pending, start] = useTransition();

  function accept() {
    setAccepted(true); // optimistic
    start(() => acceptHandoverAction(handover.id));
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-aria/25 bg-panel shadow-quiet">
      <div className="flex items-center justify-between gap-3 bg-soft-purple px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-aria/15 text-aria">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">ARIA handover</p>
            <p className="text-xs text-ink-soft">
              AI intake · {handover.language} · {formatTime(handover.createdAt)}
            </p>
          </div>
        </div>
        <TriageBadge level={handover.suggestedTriage} size="sm" />
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Chief complaint
          </p>
          <p className="mt-0.5 font-semibold text-ink">
            {handover.chiefComplaint}
          </p>
          <p className="text-sm text-ink-soft">
            Duration: {handover.durationText}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Narrative
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink/85">
            {handover.narrative}
          </p>
        </div>

        {handover.symptoms.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {handover.symptoms.map((s) => (
              <Badge key={s} tone="aria" size="sm">
                {s}
              </Badge>
            ))}
          </div>
        )}

        {handover.redFlags.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-red">
              Red flags · deterministic escalation
            </p>
            <RedFlags flags={handover.redFlags} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
          <ConfidenceMeter value={handover.aiConfidence} />
          {accepted ? (
            <Badge tone="green">
              <Check /> Accepted by clinician
            </Badge>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <MessageCircle className="size-4" /> Ask ARIA
              </Button>
              <Button size="sm" variant="aria" onClick={accept} disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Accept summary
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-ink-faint">
          ARIA output is unverified. Accept, edit, or override before it informs
          your notes or prescription.
        </p>
      </div>
    </section>
  );
}
