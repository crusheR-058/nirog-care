import type { Metadata } from "next";
import {
  BadgeCheck,
  KeyRound,
  Fingerprint,
  Languages,
  ShieldCheck,
  Database,
} from "lucide-react";
import { getDataSource } from "@/lib/data/source";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MfaSetup } from "@/components/portal/mfa-setup";
import { CallDiagnostics } from "@/components/portal/call-diagnostics";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ds = await getDataSource();
  const doctor = await ds.getDoctor();
  const backend =
    {
      supabase: "Supabase Postgres (RLS-enforced)",
      db: "PostgreSQL (Prisma)",
      mock: "In-memory mock",
    }[process.env.NIROG_DATA_SOURCE ?? "mock"] ?? "In-memory mock";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Your verified identity, security posture and workspace.
        </p>
      </header>

      {/* Identity */}
      <section className="rounded-2xl border border-hairline bg-panel p-5 shadow-quiet">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={doctor.fullName} tone="blue" size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">
                {doctor.fullName}
              </h2>
              <Badge tone="green" size="sm">
                <BadgeCheck /> HPR verified
              </Badge>
            </div>
            <p className="text-sm text-ink-soft">
              {doctor.specialty} · {doctor.clinicName}
            </p>
            <p className="mt-0.5 font-mono text-xs text-ink-faint">
              {doctor.registrationNo} · {doctor.email}
            </p>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-hairline bg-panel p-5 shadow-quiet">
        <h2 className="mb-4 font-semibold text-ink">Security</h2>
        <div className="divide-y divide-hairline">
          <MfaSetup />
          <Row
            icon={Fingerprint}
            title="Passkey"
            desc="Biometric or device unlock for fast, phishing-resistant return."
            action={
              <Button variant="outline" size="sm">
                Add passkey
              </Button>
            }
          />
          <Row
            icon={ShieldCheck}
            title="Step-up for high-risk actions"
            desc="Re-verify before prescribing, exporting or break-glass access."
            action={<Badge tone="blue">Always on</Badge>}
          />
        </div>
      </section>

      {/* Languages */}
      <section className="rounded-2xl border border-hairline bg-panel p-5 shadow-quiet">
        <div className="mb-3 flex items-center gap-2">
          <Languages className="size-5 text-indigo" />
          <h2 className="font-semibold text-ink">Consultation languages</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {doctor.languages.map((l) => (
            <Badge key={l} tone="indigo">
              {l}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          ARIA translates patient intake into your preferred language while
          preserving the original for the record.
        </p>
      </section>

      {/* Backend */}
      <section className="rounded-2xl border border-hairline bg-panel p-5 shadow-quiet">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-ink-soft" />
          <h2 className="font-semibold text-ink">Data source</h2>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          This workspace is reading from{" "}
          <span className="font-medium text-ink">{backend}</span>. The portal
          talks to one shared authenticated API contract, so the backend can be
          swapped without changing the interface.
        </p>
      </section>

      <CallDiagnostics />
    </div>
  );
}

function Row({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: typeof KeyRound;
  title: string;
  desc: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-ink-soft">
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-ink-soft">{desc}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
