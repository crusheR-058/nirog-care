import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertOctagon, Activity, Pill } from "lucide-react";
import { getDataSource } from "@/lib/data/source";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ConsultStage } from "@/components/portal/consult-stage";
import { ConsultForm } from "@/components/portal/consult-form";
import { HandoverCard } from "@/components/portal/handover-card";
import { TriageBadge } from "@/components/portal/clinical";

export const metadata: Metadata = { title: "Consultation" };
export const dynamic = "force-dynamic";

export default async function ConsultPage({
  params,
}: {
  params: Promise<{ queueId: string }>;
}) {
  const { queueId } = await params;
  const ds = await getDataSource();
  const item = await ds.getQueueItem(queueId);
  if (!item) notFound();
  const [chart, doctor] = await Promise.all([
    ds.getPatientChart(item.patientId),
    ds.getDoctor(),
  ]);
  if (!chart) notFound();

  const { patient, handover } = chart;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/portal/patients/${patient.id}`}>
            <ArrowLeft className="size-4" /> Chart
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <TriageBadge level={item.triage} size="sm" />
        </div>
      </div>

      {/* The call is the primary surface — give it the wider column. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Consult surface + context */}
        <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center gap-3">
            <Avatar name={patient.fullName} tone={patient.avatarTone as never} size="lg" />
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-ink">
                {patient.fullName}
              </h1>
              <p className="text-sm text-ink-soft">{item.reason}</p>
            </div>
          </div>

          <ConsultStage
            room={item.id}
            patientName={patient.fullName}
            doctorName={doctor.fullName}
            avatarTone={patient.avatarTone}
            channel={item.channel}
            connection={item.connectionQuality}
          />

          {/* Quick clinical context at a glance during the call */}
          <div className="grid grid-cols-3 gap-2">
            <MiniContext
              icon={AlertOctagon}
              tone="red"
              label="Allergies"
              value={
                patient.allergies.length ? patient.allergies.join(", ") : "None"
              }
            />
            <MiniContext
              icon={Activity}
              tone="amber"
              label="Conditions"
              value={
                patient.conditions.length
                  ? patient.conditions.join(", ")
                  : "None"
              }
            />
            <MiniContext
              icon={Pill}
              tone="blue"
              label="Medication"
              value={
                patient.currentMedications.length
                  ? patient.currentMedications.join(", ")
                  : "None"
              }
            />
          </div>

          {handover && (
            <div className="hidden lg:block">
              <HandoverCard handover={handover} />
            </div>
          )}
        </div>

        {/* Care-plan capture */}
        <div>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-ink">Care plan</h2>
            <p className="text-sm text-ink-soft">
              Notes, prescription and follow-up — filed under your registration.
            </p>
          </div>
          <ConsultForm
            patientId={patient.id}
            queueId={item.id}
            channel={item.channel}
            handover={handover}
          />
        </div>

        {/* ARIA handover on mobile appears after the form intro */}
        {handover && (
          <div className="lg:hidden">
            <HandoverCard handover={handover} />
          </div>
        )}
      </div>
    </div>
  );
}

function MiniContext({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof Pill;
  tone: "red" | "amber" | "blue";
  label: string;
  value: string;
}) {
  const toneClass = {
    red: "text-red",
    amber: "text-amber",
    blue: "text-blue",
  }[tone];
  return (
    <div className="rounded-xl border border-hairline bg-panel p-2.5 shadow-quiet">
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${toneClass}`}>
        <Icon className="size-3" /> {label}
      </span>
      <p className="mt-0.5 line-clamp-2 text-xs text-ink/85">{value}</p>
    </div>
  );
}
