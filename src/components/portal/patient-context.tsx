import {
  MapPin,
  Languages,
  ShieldCheck,
  ShieldAlert,
  Pill,
  Activity,
  AlertOctagon,
  CircleUser,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ConsentGrant, Patient } from "@/lib/domain/types";
import { formatDate } from "@/lib/utils";

function age(dob: string): number {
  const b = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

const relationshipLabel: Record<string, string> = {
  self: "Account holder",
  child: "Dependent (child)",
  parent: "Dependent (parent)",
  spouse: "Dependent (spouse)",
  dependent: "Dependent",
};

export function PatientHeader({
  patient,
  consent,
}: {
  patient: Patient;
  consent?: ConsentGrant;
}) {
  const consentActive = consent?.active ?? false;
  return (
    <div className="rounded-2xl border border-hairline bg-panel p-5 shadow-quiet">
      <div className="flex flex-wrap items-start gap-4">
        <Avatar name={patient.fullName} tone={patient.avatarTone as never} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-bold tracking-tight text-ink">
              {patient.fullName}
            </h1>
            <Badge tone="neutral" size="sm">
              <CircleUser className="size-3" />
              {relationshipLabel[patient.relationshipToAccount]}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">
            <span className="tnum">{age(patient.dateOfBirth)}</span> years ·{" "}
            {patient.sex} · {patient.phoneMasked}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-ink-faint" />
              {patient.village}, {patient.district}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Languages className="size-4 text-ink-faint" />
              {patient.preferredLanguage}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {patient.abhaLinked ? (
                <>
                  <ShieldCheck className="size-4 text-green" /> ABHA linked
                </>
              ) : (
                <span className="text-ink-faint">ABHA not linked</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Consent banner — records are visible only while consent is active. */}
      <div
        className={`mt-4 flex flex-wrap items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm ${
          consentActive
            ? "bg-soft-green text-green"
            : "bg-soft-amber text-amber"
        }`}
      >
        {consentActive ? (
          <ShieldCheck className="size-4 shrink-0" />
        ) : (
          <ShieldAlert className="size-4 shrink-0" />
        )}
        {consentActive && consent ? (
          <span className="text-ink/80">
            <span className="font-medium text-green">Consent active</span> ·{" "}
            {consent.purpose} · expires {formatDate(consent.expiresAt)}
          </span>
        ) : (
          <span className="text-ink/80">
            <span className="font-medium text-amber">Consent pending</span> —
            request access before viewing full records. Break-glass requires a
            logged reason.
          </span>
        )}
      </div>
    </div>
  );
}

function ContextBlock({
  icon: Icon,
  label,
  items,
  emptyText,
  tone,
}: {
  icon: typeof Pill;
  label: string;
  items: string[];
  emptyText: string;
  tone: "red" | "amber" | "blue";
}) {
  const toneClass = {
    red: "text-red bg-soft-red",
    amber: "text-amber bg-soft-amber",
    blue: "text-blue bg-soft-blue",
  }[tone];
  return (
    <div className="rounded-2xl border border-hairline bg-panel p-4 shadow-quiet">
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`grid size-7 place-items-center rounded-lg ${toneClass}`}>
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-semibold text-ink">{label}</h3>
      </div>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {items.map((it) => (
            <li key={it} className="text-sm text-ink/85">
              {it}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-faint">{emptyText}</p>
      )}
    </div>
  );
}

export function KnownContext({ patient }: { patient: Patient }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <ContextBlock
        icon={AlertOctagon}
        label="Allergies"
        items={patient.allergies}
        emptyText="No known allergies"
        tone="red"
      />
      <ContextBlock
        icon={Activity}
        label="Conditions"
        items={patient.conditions}
        emptyText="None recorded"
        tone="amber"
      />
      <ContextBlock
        icon={Pill}
        label="Current medication"
        items={patient.currentMedications}
        emptyText="None recorded"
        tone="blue"
      />
    </div>
  );
}
