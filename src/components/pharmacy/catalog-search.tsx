"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

/**
 * Debounced catalogue search. Pushes to the URL rather than holding results in
 * component state, so a search is shareable, bookmarkable and survives a
 * refresh — and the server component stays the single source of truth.
 */
export function CatalogSearch({
  initialQuery,
  group,
}: {
  initialQuery: string;
  group: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [pending, start] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    // Don't re-navigate on mount — the server already rendered this query.
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      if (value.trim()) p.set("q", value.trim());
      if (group && group !== "all") p.set("group", group);
      const s = p.toString();
      start(() => router.replace(`/pharmacy/catalog${s ? `?${s}` : ""}`));
    }, 280);
    return () => clearTimeout(t);
  }, [value, group, router]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search 5,154 substances — name, ATC code or class…"
        aria-label="Search the drug catalogue"
        className="h-12 w-full rounded-2xl border border-hairline bg-panel pl-10 pr-20 text-sm text-ink placeholder:text-ink-faint focus:border-hairline-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)]"
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {pending && <Loader2 className="size-4 animate-spin text-ink-faint" />}
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            aria-label="Clear search"
            className="grid size-6 place-items-center rounded-full text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
