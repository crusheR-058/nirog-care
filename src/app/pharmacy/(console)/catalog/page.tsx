import type { Metadata } from "next";
import Link from "next/link";
import { Globe2, SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  ATC_GROUPS,
  ATC_ROUTES,
  drugGroupCounts,
  searchDrugs,
} from "@/lib/data/drugs";
import { EmptyState } from "@/components/pharmacy/console-ui";
import { CatalogSearch } from "@/components/pharmacy/catalog-search";

export const metadata: Metadata = {
  title: "Drug catalogue · Nirog Pharmacy",
  description:
    "The WHO ATC/DDD classification — every classified drug substance, searchable by name, code or therapeutic class.",
};
export const dynamic = "force-dynamic";

const PAGE = 60;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const group = sp.group && sp.group !== "all" ? sp.group : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  const [{ drugs, total }, counts] = await Promise.all([
    searchDrugs(supabase, {
      query: q,
      group,
      limit: PAGE,
      offset: (page - 1) * PAGE,
    }),
    drugGroupCounts(supabase),
  ]);

  const pages = Math.ceil(total / PAGE);
  const allTotal = Object.values(counts).reduce((a, b) => a + b, 0);

  function href(next: Record<string, string | number | undefined>) {
    const p = new URLSearchParams();
    const merged = { q, group: group ?? "all", page, ...next };
    if (merged.q) p.set("q", String(merged.q));
    if (merged.group && merged.group !== "all") p.set("group", String(merged.group));
    if (merged.page && Number(merged.page) > 1) p.set("page", String(merged.page));
    const s = p.toString();
    return `/pharmacy/catalog${s ? `?${s}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue">
          <Globe2 className="size-3.5" /> WHO ATC/DDD classification
        </p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          World drug catalogue
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          <span className="tnum font-semibold text-ink">
            {allTotal.toLocaleString()}
          </span>{" "}
          classified drug substances across all 14 anatomical groups — the same
          index clinicians prescribe from, so every line you dispense maps to a
          globally unique ATC code.
        </p>
      </header>

      <CatalogSearch initialQuery={q} group={group ?? "all"} />

      {/* group facets */}
      <div className="mt-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-wrap lg:px-0">
        <Link
          href={href({ group: "all", page: 1 })}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            !group
              ? "bg-blue text-white"
              : "border border-hairline bg-panel text-ink-soft hover:text-ink"
          }`}
        >
          All <span className="tnum opacity-70">{allTotal}</span>
        </Link>
        {ATC_GROUPS.map((g) => (
          <Link
            key={g.code}
            href={href({ group: g.code, page: 1 })}
            title={g.label}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              group === g.code
                ? "bg-blue text-white"
                : "border border-hairline bg-panel text-ink-soft hover:text-ink"
            }`}
          >
            <span className="tnum font-mono opacity-60">{g.code}</span>{" "}
            {g.short}{" "}
            <span className="tnum opacity-60">{counts[g.code] ?? 0}</span>
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs text-ink-faint">
        <span className="tnum font-semibold text-ink-soft">
          {total.toLocaleString()}
        </span>{" "}
        {q ? `matching “${q}”` : "substances"}
        {group ? ` in ${ATC_GROUPS.find((g) => g.code === group)?.label}` : ""}
      </p>

      {drugs.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={SearchX}
            title="No substances match"
            body="Try a generic (INN) name such as amoxicillin, an ATC code like J01CA04, or a class such as “beta blocking”."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {drugs.map((d) => (
            <article
              key={d.id}
              className="rounded-2xl border border-hairline bg-panel p-3.5 transition-colors hover:border-hairline-strong hover:bg-panel-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-sm font-bold capitalize leading-snug text-ink">
                  {d.name}
                </h2>
                <span className="tnum shrink-0 rounded-md bg-soft-blue px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue">
                  {d.atcCode}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">
                {d.chemicalName || d.pharmacologicalName}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-panel-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
                  {ATC_GROUPS.find((g) => g.code === d.anatomicalCode)?.short ??
                    d.anatomicalName}
                </span>
                {d.ddd != null && (
                  <span
                    className="rounded-md bg-panel-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-soft"
                    title="WHO Defined Daily Dose"
                  >
                    DDD {d.ddd} {d.dddUom}
                  </span>
                )}
                {d.route && (
                  <span className="rounded-md bg-panel-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
                    {ATC_ROUTES[d.route] ?? d.route}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2 text-xs">
          <PageLink disabled={page <= 1} href={href({ page: page - 1 })}>
            Previous
          </PageLink>
          <span className="tnum px-2 text-ink-faint">
            Page {page} of {pages.toLocaleString()}
          </span>
          <PageLink disabled={page >= pages} href={href({ page: page + 1 })}>
            Next
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-full border border-hairline px-3.5 py-1.5 font-semibold text-ink-faint opacity-40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-full border border-hairline bg-panel px-3.5 py-1.5 font-semibold text-ink-soft transition-colors hover:text-ink"
    >
      {children}
    </Link>
  );
}
