"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Loader2, Pill } from "lucide-react";
import type { Drug } from "@/lib/domain/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Typeahead over the WHO ATC catalogue.
 *
 * Free text is still allowed — a clinician must never be blocked by a
 * catalogue gap — but picking a suggestion attaches the ATC code, which is what
 * lets the receiving pharmacy dispense against a globally unique identifier
 * instead of parsing a name.
 */
export function DrugPicker({
  value,
  atcCode,
  onChange,
  placeholder = "Drug (e.g. Amlodipine)",
  className,
}: {
  value: string;
  atcCode?: string;
  onChange: (next: { drug: string; atcCode?: string; drugId?: string; form?: string }) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(false);
  const listId = useId();

  const term = value.trim();
  // Below two characters a substring query matches most of the catalogue, so
  // we neither fetch nor show. Derived rather than cleared in state, which
  // keeps the effect free of synchronous setState.
  const tooShort = term.length < 2;

  // Debounced fetch. `skipRef` suppresses the query that would otherwise fire
  // immediately after a selection sets the input to the chosen name.
  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    if (term.length < 2) return;

    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/drugs?q=${encodeURIComponent(term)}`);
        const json = await res.json();
        if (!cancelled) {
          setResults(json.drugs ?? []);
          setHighlight(0);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [term]);

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function select(d: Drug) {
    skipRef.current = true;
    onChange({ drug: d.name, atcCode: d.atcCode, drugId: d.id });
    setOpen(false);
    setResults([]);
  }

  // Results for a term the user has since shortened are stale — drop them at
  // render rather than clearing state from the effect.
  const visible = tooShort ? [] : results;
  const show = open && !tooShort && (visible.length > 0 || loading);

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <Input
        value={value}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        onChange={(e) => {
          onChange({ drug: e.target.value, atcCode: undefined, drugId: undefined });
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!show) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, visible.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && visible[highlight]) {
            e.preventDefault();
            select(visible[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />

      {atcCode && (
        <span
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md bg-soft-green px-1.5 py-0.5 font-mono text-[10px] font-semibold text-green"
          title="Matched to the WHO ATC catalogue"
        >
          {atcCode}
        </span>
      )}
      {loading && !atcCode && (
        <Loader2 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-ink-faint" />
      )}

      {show && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-hairline bg-panel py-1 shadow-float"
        >
          {loading && visible.length === 0 && (
            <li className="px-3 py-2 text-xs text-ink-faint">Searching…</li>
          )}
          {visible.map((d, i) => (
            <li key={d.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => select(d)}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2 text-left transition-colors",
                  i === highlight ? "bg-soft-blue" : "hover:bg-panel-2"
                )}
              >
                <Pill className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold capitalize text-ink">
                    {d.name}
                  </span>
                  <span className="block truncate text-[11px] text-ink-faint">
                    {d.chemicalName || d.pharmacologicalName}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[10px] font-semibold text-blue">
                  {d.atcCode}
                </span>
                {atcCode === d.atcCode && (
                  <Check className="size-3.5 shrink-0 text-green" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
