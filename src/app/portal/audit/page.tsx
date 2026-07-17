import type { Metadata } from "next";
import { ShieldCheck, Lock, Eye, FileWarning } from "lucide-react";
import { getDataSource } from "@/lib/data/source";
import { TrustLog } from "@/components/portal/trust-log";

export const metadata: Metadata = { title: "Trust log" };
export const dynamic = "force-dynamic";

const principles = [
  { icon: Eye, title: "Every read is logged", text: "Opening a chart records who, what and why." },
  { icon: Lock, title: "Immutable", text: "Audit entries cannot be edited or deleted." },
  { icon: FileWarning, title: "Break-glass needs a reason", text: "Access without consent is possible but always explained." },
];

export default async function AuditPage() {
  const ds = await getDataSource();
  const events = await ds.getRecentAudit(30);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-soft-green text-green">
            <ShieldCheck className="size-5" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Trust log
          </h1>
        </div>
        <p className="mt-1.5 text-sm text-ink-soft">
          The client requests, the server decides — and records it. This is the
          accountable access trail behind every record in Nirog.
        </p>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {principles.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-2xl border border-hairline bg-panel p-4 shadow-quiet"
          >
            <Icon className="size-5 text-green" />
            <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
            <p className="text-xs text-ink-soft">{text}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-hairline bg-panel p-5 shadow-quiet">
        <h2 className="mb-4 font-semibold text-ink">Recent activity</h2>
        <TrustLog events={events} />
      </section>
    </div>
  );
}
