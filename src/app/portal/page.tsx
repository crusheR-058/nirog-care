import type { Metadata } from "next";
import { Users, TriangleAlert, CalendarClock, Timer, CheckCircle2 } from "lucide-react";
import { getDataSource } from "@/lib/data/source";
import { StatTile } from "@/components/portal/stat-tile";
import { QueueList } from "@/components/portal/queue-list";
import { QueueRealtime } from "@/components/portal/queue-realtime";
import { AriaSpotlight } from "@/components/portal/aria-spotlight";
import { TrustLog } from "@/components/portal/trust-log";

export const metadata: Metadata = { title: "Today" };
export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function TodayPage() {
  const ds = await getDataSource();
  const [doctor, stats, queue, audit] = await Promise.all([
    ds.getDoctor(),
    ds.getDashboardStats(),
    ds.getQueue(),
    ds.getRecentAudit(5),
  ]);

  // Top emergency with an ARIA handover drives the spotlight.
  const spotlight = queue.find(
    (q) => q.state === "waiting" && q.handoverId && q.triage === "emergency"
  );
  const spotlightChart = spotlight
    ? await ds.getPatientChart(spotlight.patientId)
    : null;

  const shortName = doctor.fullName.replace(/^Dr\.?\s*/, "");

  return (
    <div className="mx-auto max-w-6xl">
      <header className="rise">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          {greeting()}, Dr. {shortName.split(" ").slice(-1)[0]}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {stats.waiting > 0
            ? `${stats.waiting} patient${stats.waiting > 1 ? "s" : ""} waiting${
                stats.emergencies > 0 ? ` · ${stats.emergencies} need urgent review` : ""
              }.`
            : "No one is waiting right now. Scheduled consults are below."}
        </p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Waiting" value={stats.waiting} icon={Users} accent="blue" />
        <StatTile
          label="Emergencies"
          value={stats.emergencies}
          icon={TriangleAlert}
          accent="red"
          hint={stats.emergencies > 0 ? "Review first" : "None"}
        />
        <StatTile
          label="Scheduled"
          value={stats.scheduledToday}
          icon={CalendarClock}
          accent="indigo"
        />
        <StatTile
          label="Avg wait"
          value={stats.avgWaitMin}
          unit="min"
          icon={Timer}
          accent="amber"
        />
        <StatTile
          label="Completed"
          value={stats.completedToday}
          icon={CheckCircle2}
          accent="green"
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">
                Today&rsquo;s queue
              </h2>
              <QueueRealtime />
            </div>
            <span className="hidden text-sm text-ink-faint sm:inline">
              Sorted by triage, then wait time
            </span>
          </div>
          <QueueList items={queue} />
        </section>

        <aside className="flex flex-col gap-6">
          {spotlight && spotlightChart?.handover && (
            <AriaSpotlight
              patient={spotlightChart.patient}
              handover={spotlightChart.handover}
              queueId={spotlight.id}
            />
          )}

          <section className="rounded-2xl border border-hairline bg-panel p-5 shadow-quiet">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-ink">Trust log</h2>
              <span className="text-xs text-ink-faint">Immutable · who / what / why</span>
            </div>
            <TrustLog events={audit} />
          </section>
        </aside>
      </div>
    </div>
  );
}
