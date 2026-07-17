"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, ShieldCheck, ShieldAlert } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { PatientListItem } from "@/lib/data/source";

export function PatientsList({ patients }: { patients: PatientListItem[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(term) ||
        p.village.toLowerCase().includes(term) ||
        p.conditions.some((c) => c.toLowerCase().includes(term))
    );
  }, [q, patients]);

  return (
    <>
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, village or condition"
          className="pl-10"
          aria-label="Search patients"
        />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/portal/patients/${p.id}`}
            className="group flex items-center gap-3.5 rounded-2xl border border-hairline bg-panel p-3.5 shadow-quiet transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <Avatar name={p.fullName} tone={p.avatarTone as never} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-ink">{p.fullName}</p>
                <span className="tnum text-xs text-ink-faint">{p.age}y</span>
                {p.inQueue && (
                  <span className="size-1.5 rounded-full bg-blue" title="In today's queue" />
                )}
              </div>
              <p className="truncate text-sm text-ink-soft">
                {p.village} · {p.conditions.length ? p.conditions.join(", ") : "No chronic conditions"}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {p.consentActive ? (
                  <Badge tone="green" size="sm">
                    <ShieldCheck /> Consent active
                  </Badge>
                ) : (
                  <Badge tone="amber" size="sm">
                    <ShieldAlert /> Consent pending
                  </Badge>
                )}
                {p.abhaLinked && (
                  <Badge tone="neutral" size="sm">
                    ABHA
                  </Badge>
                )}
              </div>
            </div>
            <ChevronRight className="size-5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-ink-soft">
          No patients match &ldquo;{q}&rdquo;.
        </p>
      )}
    </>
  );
}
