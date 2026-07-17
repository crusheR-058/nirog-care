import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, HeartPulse, CheckCircle2 } from "lucide-react";
import { getDataSource } from "@/lib/data/source";
import { Button } from "@/components/ui/button";
import { PatientHeader, KnownContext } from "@/components/portal/patient-context";
import { HandoverCard } from "@/components/portal/handover-card";
import { EncounterHistory } from "@/components/portal/encounter-history";
import { PatientDocuments } from "@/components/portal/documents";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ds = await getDataSource();
  const chart = await ds.getPatientChart(id);
  return { title: chart ? chart.patient.fullName : "Patient" };
}

export default async function PatientChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filed?: string }>;
}) {
  const { id } = await params;
  const { filed } = await searchParams;
  const ds = await getDataSource();
  const chart = await ds.getPatientChart(id);
  if (!chart) notFound();

  const queue = await ds.getQueue();
  const inQueue = queue.find(
    (q) => q.patientId === id && (q.state === "waiting" || q.state === "scheduled")
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portal">
            <ArrowLeft className="size-4" /> Queue
          </Link>
        </Button>
        {inQueue && (
          <Button size="sm" asChild>
            <Link href={`/portal/consult/${inQueue.id}`}>
              <HeartPulse className="size-4" /> Start consultation
            </Link>
          </Button>
        )}
      </div>

      {filed && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-soft-green px-4 py-3 text-sm text-green">
          <CheckCircle2 className="size-4 shrink-0" />
          <span className="text-ink/85">
            Encounter filed under your registration and added to the care
            history. The patient will receive the plan in the Nirog app.
          </span>
        </div>
      )}

      <div className="rise space-y-5">
        <PatientHeader patient={chart.patient} consent={chart.consent} />
        <KnownContext patient={chart.patient} />

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-5">
            {chart.handover && <HandoverCard handover={chart.handover} />}
            <PatientDocuments patientId={chart.patient.id} />
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Care history</h2>
            <EncounterHistory history={chart.history} />
          </div>
        </div>
      </div>
    </div>
  );
}
