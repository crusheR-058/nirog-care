import { FileText, Pill, FlaskConical, CalendarClock, Sparkles } from "lucide-react";
import { ChannelBadge } from "@/components/portal/clinical";
import type { Encounter } from "@/lib/domain/types";
import { formatDate } from "@/lib/utils";

export function EncounterHistory({ history }: { history: Encounter[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline-strong bg-panel/50 p-6 text-center">
        <FileText className="mx-auto size-6 text-ink-faint" />
        <p className="mt-2 text-sm font-medium text-ink">No prior encounters</p>
        <p className="text-sm text-ink-soft">
          This is the patient&rsquo;s first recorded visit on Nirog.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {history.map((e) => (
        <article
          key={e.id}
          className="rounded-2xl border border-hairline bg-panel p-5 shadow-quiet"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-ink">{e.chiefComplaint}</h3>
              {e.ariaAccepted && (
                <span
                  className="inline-flex items-center gap-1 text-xs text-aria"
                  title="ARIA intake was reviewed and accepted"
                >
                  <Sparkles className="size-3" /> ARIA-assisted
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ChannelBadge channel={e.channel} />
              <span className="text-xs text-ink-faint">
                {formatDate(e.startedAt)}
              </span>
            </div>
          </div>

          <p className="mt-2 text-sm text-ink/85">
            <span className="font-medium text-ink">Assessment. </span>
            {e.assessment}
          </p>
          {e.clinicalNotes && (
            <p className="mt-1 text-sm text-ink-soft">{e.clinicalNotes}</p>
          )}

          <div className="mt-3 flex flex-col gap-2 text-sm">
            {e.prescriptions.length > 0 && (
              <div className="flex items-start gap-2">
                <Pill className="mt-0.5 size-4 shrink-0 text-blue" />
                <span className="text-ink/85">
                  {e.prescriptions
                    .map(
                      (p) =>
                        `${p.drug} ${p.strength} — ${p.frequency}, ${p.durationDays}d`
                    )
                    .join(" · ")}
                </span>
              </div>
            )}
            {e.labRequests.length > 0 && (
              <div className="flex items-start gap-2">
                <FlaskConical className="mt-0.5 size-4 shrink-0 text-indigo" />
                <span className="text-ink/85">
                  {e.labRequests.map((l) => l.test).join(" · ")}
                </span>
              </div>
            )}
            {e.followUp && (
              <div className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-amber" />
                <span className="text-ink/85">
                  Follow-up in {e.followUp.inDays} days —{" "}
                  {e.followUp.instructions}
                </span>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
