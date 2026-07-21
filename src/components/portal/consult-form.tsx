"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Pill,
  FlaskConical,
  CalendarClock,
  Plus,
  Trash2,
  Check,
  Loader2,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DrugPicker } from "@/components/portal/drug-picker";
import { saveEncounterAction } from "@/app/portal/actions";
import type {
  AriaHandover,
  ConsultChannel,
  LabRequest,
  Prescription,
} from "@/lib/domain/types";

type RxRow = Prescription;
type LabRow = LabRequest;

function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

const emptyRx = (): RxRow => ({
  id: uid(),
  drug: "",
  strength: "",
  form: "Tablet",
  dose: "1",
  frequency: "Once daily",
  durationDays: 5,
});

const freqOptions = [
  "Once daily",
  "Twice daily",
  "Thrice daily",
  "At night",
  "As needed",
];

export function ConsultForm({
  patientId,
  queueId,
  channel,
  handover,
}: {
  patientId: string;
  queueId: string;
  channel: ConsultChannel;
  handover?: AriaHandover;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [chiefComplaint, setChief] = useState(handover?.chiefComplaint ?? "");
  const [assessment, setAssessment] = useState("");
  const [notes, setNotes] = useState("");
  const [prescriptions, setRx] = useState<RxRow[]>([]);
  const [labs, setLabs] = useState<LabRow[]>([]);
  const [followEnabled, setFollowEnabled] = useState(false);
  const [followDays, setFollowDays] = useState(7);
  const [followChannel, setFollowChannel] = useState<ConsultChannel>(channel);
  const [followNote, setFollowNote] = useState("");
  const [ariaAccepted, setAriaAccepted] = useState(false);

  function updateRx(id: string, patch: Partial<RxRow>) {
    setRx((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function updateLab(id: string, patch: Partial<LabRow>) {
    setLabs((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function submit() {
    setError(null);
    start(async () => {
      const result = await saveEncounterAction({
        patientId,
        queueId,
        chiefComplaint,
        assessment,
        clinicalNotes: notes,
        channel,
        prescriptions: prescriptions.filter((r) => r.drug.trim()),
        labRequests: labs.filter((r) => r.test.trim()),
        followUp: followEnabled
          ? {
              inDays: followDays,
              channel: followChannel,
              instructions: followNote || "Routine review",
            }
          : undefined,
        ariaAccepted,
      });
      if (result.ok) {
        router.push(`/portal/patients/${patientId}?filed=1`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ARIA prefill nudge */}
      {handover && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-aria/25 bg-soft-purple/60 p-3.5">
          <input
            type="checkbox"
            checked={ariaAccepted}
            onChange={(e) => setAriaAccepted(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--aria)]"
          />
          <span className="text-sm text-ink/85">
            <span className="inline-flex items-center gap-1 font-medium text-aria">
              <Sparkles className="size-3.5" /> Accept ARIA&rsquo;s intake
            </span>{" "}
            into this note. You remain accountable — edit anything below.
          </span>
        </label>
      )}

      {/* Assessment */}
      <Section icon={ClipboardList} title="Assessment &amp; plan" accent="blue">
        <div className="grid gap-3">
          <Field label="Chief complaint">
            <Input
              value={chiefComplaint}
              onChange={(e) => setChief(e.target.value)}
              placeholder="Presenting complaint"
            />
          </Field>
          <Field label="Clinical assessment" required>
            <Textarea
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="Working diagnosis and clinical reasoning…"
              rows={3}
            />
          </Field>
          <Field label="Notes &amp; advice">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Advice to the patient, safety-netting, red-flag guidance…"
              rows={2}
            />
          </Field>
        </div>
      </Section>

      {/* Prescriptions */}
      <Section icon={Pill} title="Prescription" accent="blue">
        <div className="flex flex-col gap-3">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="rounded-xl border border-hairline bg-panel-2 p-3"
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <DrugPicker
                  className="col-span-2 sm:col-span-2"
                  value={rx.drug}
                  atcCode={rx.atcCode}
                  onChange={(next) => updateRx(rx.id, next)}
                />
                <Input
                  placeholder="Strength"
                  value={rx.strength}
                  onChange={(e) => updateRx(rx.id, { strength: e.target.value })}
                />
                <select
                  className="h-11 rounded-xl border border-input bg-panel px-3 text-sm text-ink"
                  value={rx.frequency}
                  onChange={(e) => updateRx(rx.id, { frequency: e.target.value })}
                >
                  {freqOptions.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-ink-soft">Duration</span>
                <Input
                  type="number"
                  min={1}
                  className="h-9 w-20"
                  value={rx.durationDays}
                  onChange={(e) =>
                    updateRx(rx.id, {
                      durationDays: Number(e.target.value) || 0,
                    })
                  }
                />
                <span className="text-xs text-ink-soft">days</span>
                <button
                  type="button"
                  onClick={() =>
                    setRx((rows) => rows.filter((r) => r.id !== rx.id))
                  }
                  className="ml-auto grid size-8 place-items-center rounded-lg text-ink-faint hover:bg-soft-red hover:text-red"
                  aria-label="Remove medication"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setRx((r) => [...r, emptyRx()])}
          >
            <Plus className="size-4" /> Add medication
          </Button>
        </div>
      </Section>

      {/* Lab requests */}
      <Section icon={FlaskConical} title="Investigations" accent="indigo">
        <div className="flex flex-col gap-2">
          {labs.map((lab) => (
            <div key={lab.id} className="flex items-center gap-2">
              <Input
                placeholder="Test (e.g. HbA1c)"
                value={lab.test}
                onChange={(e) => updateLab(lab.id, { test: e.target.value })}
              />
              <select
                className="h-11 rounded-xl border border-input bg-panel px-3 text-sm text-ink"
                value={lab.priority}
                onChange={(e) =>
                  updateLab(lab.id, {
                    priority: e.target.value as LabRow["priority"],
                  })
                }
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  setLabs((rows) => rows.filter((r) => r.id !== lab.id))
                }
                className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-soft-red hover:text-red"
                aria-label="Remove test"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              setLabs((r) => [
                ...r,
                { id: uid(), test: "", priority: "routine" },
              ])
            }
          >
            <Plus className="size-4" /> Add investigation
          </Button>
        </div>
      </Section>

      {/* Follow-up */}
      <Section icon={CalendarClock} title="Follow-up" accent="amber">
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={followEnabled}
            onChange={(e) => setFollowEnabled(e.target.checked)}
            className="size-4 accent-[var(--amber)]"
          />
          <span className="text-sm text-ink">Schedule a follow-up</span>
        </label>
        {followEnabled && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="In (days)">
              <Input
                type="number"
                min={1}
                value={followDays}
                onChange={(e) => setFollowDays(Number(e.target.value) || 1)}
              />
            </Field>
            <Field label="Channel">
              <select
                className="h-11 w-full rounded-xl border border-input bg-panel px-3 text-sm text-ink"
                value={followChannel}
                onChange={(e) =>
                  setFollowChannel(e.target.value as ConsultChannel)
                }
              >
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="chat">Chat</option>
              </select>
            </Field>
            <Field label="Instructions" className="sm:col-span-2">
              <Input
                value={followNote}
                onChange={(e) => setFollowNote(e.target.value)}
                placeholder="e.g. Review BP diary and lab results"
              />
            </Field>
          </div>
        )}
      </Section>

      {error && (
        <p role="alert" className="rounded-lg bg-soft-red px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}

      <div className="sticky bottom-20 z-10 flex items-center gap-3 rounded-2xl border border-hairline bg-panel/90 p-3 shadow-lift backdrop-blur lg:bottom-4">
        <div className="flex flex-1 flex-wrap items-center gap-1.5 text-xs text-ink-soft">
          {prescriptions.some((r) => r.drug) && (
            <Badge tone="blue" size="sm">
              {prescriptions.filter((r) => r.drug).length} Rx
            </Badge>
          )}
          {labs.some((r) => r.test) && (
            <Badge tone="indigo" size="sm">
              {labs.filter((r) => r.test).length} tests
            </Badge>
          )}
          {followEnabled && (
            <Badge tone="amber" size="sm">
              Follow-up {followDays}d
            </Badge>
          )}
          <span className="hidden sm:inline">
            {prescriptions.some((r) => r.drug)
              ? "Filing routes the prescription to a verified pharmacy in the patient's district."
              : "Filing records the note against your registration."}
          </span>
        </div>
        <Button onClick={submit} disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          File &amp; complete
        </Button>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: typeof Pill;
  title: string;
  accent: "blue" | "indigo" | "amber";
  children: React.ReactNode;
}) {
  const tone = {
    blue: "text-blue bg-soft-blue",
    indigo: "text-indigo bg-soft-indigo",
    amber: "text-amber bg-soft-amber",
  }[accent];
  return (
    <section className="rounded-2xl border border-hairline bg-panel p-5 shadow-quiet">
      <div className="mb-3.5 flex items-center gap-2">
        <span className={`grid size-7 place-items-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
        <h3
          className="font-semibold text-ink"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label>
        <span dangerouslySetInnerHTML={{ __html: label }} />
        {required && <span className="ml-0.5 text-red">*</span>}
      </Label>
      {children}
    </div>
  );
}
