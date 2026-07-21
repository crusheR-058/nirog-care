/**
 * WHO ATC drug catalogue access.
 *
 * The catalogue is public reference data (no PII), so it is readable by any
 * authenticated session — doctors search it to prescribe, pharmacies to
 * dispense. Backed by a trigram index on `searchText`, so substring matching
 * over ~5.2k substances stays sub-millisecond.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Drug } from "@/lib/domain/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

/** The 14 WHO ATC anatomical main groups — the top level of the hierarchy. */
export const ATC_GROUPS: { code: string; label: string; short: string }[] = [
  { code: "A", label: "Alimentary tract and metabolism", short: "Alimentary" },
  { code: "B", label: "Blood and blood forming organs", short: "Blood" },
  { code: "C", label: "Cardiovascular system", short: "Cardiovascular" },
  { code: "D", label: "Dermatologicals", short: "Dermatological" },
  { code: "G", label: "Genito-urinary system and sex hormones", short: "Genito-urinary" },
  { code: "H", label: "Systemic hormonal preparations", short: "Hormonal" },
  { code: "J", label: "Anti-infectives for systemic use", short: "Anti-infective" },
  { code: "L", label: "Antineoplastic and immunomodulating agents", short: "Oncology" },
  { code: "M", label: "Musculo-skeletal system", short: "Musculoskeletal" },
  { code: "N", label: "Nervous system", short: "Nervous system" },
  { code: "P", label: "Antiparasitic products", short: "Antiparasitic" },
  { code: "R", label: "Respiratory system", short: "Respiratory" },
  { code: "S", label: "Sensory organs", short: "Sensory" },
  { code: "V", label: "Various", short: "Various" },
];

/** WHO route-of-administration codes used on DDD rows. */
export const ATC_ROUTES: Record<string, string> = {
  O: "Oral",
  P: "Parenteral",
  N: "Nasal",
  R: "Rectal",
  SL: "Sublingual",
  TD: "Transdermal",
  V: "Vaginal",
  Inhal: "Inhalation",
  "Inhal.aerosol": "Inhalation aerosol",
  "Inhal.powder": "Inhalation powder",
  "Inhal.solution": "Inhalation solution",
  Instill: "Instillation",
  "Oral aerosol": "Oral aerosol",
  "s.c.": "Subcutaneous",
  Chewing_gum: "Chewing gum",
  Implant: "Implant",
  "Intravesical": "Intravesical",
  Lamella: "Lamella",
  "Ointment": "Ointment",
  "Urethral": "Urethral",
};

export function mapDrug(d: Row): Drug {
  return {
    id: d.id,
    atcCode: d.atcCode,
    name: d.name,
    anatomicalCode: d.anatomicalCode,
    anatomicalName: d.anatomicalName,
    therapeuticCode: d.therapeuticCode,
    therapeuticName: d.therapeuticName,
    pharmacologicalCode: d.pharmacologicalCode,
    pharmacologicalName: d.pharmacologicalName,
    chemicalCode: d.chemicalCode,
    chemicalName: d.chemicalName,
    ddd: d.ddd ?? undefined,
    dddUom: d.dddUom ?? undefined,
    route: d.route ?? undefined,
  };
}

export interface DrugSearchOptions {
  query?: string;
  /** Restrict to one ATC anatomical main group (A, B, C…). */
  group?: string;
  limit?: number;
  offset?: number;
}

export async function searchDrugs(
  supabase: SupabaseClient,
  { query, group, limit = 40, offset = 0 }: DrugSearchOptions
): Promise<{ drugs: Drug[]; total: number }> {
  // Ranked in SQL, not alphabetically. Plain ordering is unsafe for
  // prescribing — searching "amlodipine" would put the combination product
  // "aliskiren and amlodipine" first simply because 'al' sorts before 'am'.
  const term = (query ?? "").trim().replace(/[%_]/g, " ").trim();

  const [rows, count] = await Promise.all([
    supabase.rpc("search_drugs", {
      q: term,
      grp: group ?? null,
      lim: limit,
      off: offset,
    }),
    supabase.rpc("count_drugs", { q: term, grp: group ?? null }),
  ]);

  if (rows.error) throw rows.error;
  return {
    drugs: ((rows.data ?? []) as Row[]).map(mapDrug),
    total: Number(count.data ?? 0),
  };
}

/** Count of substances per anatomical group — powers the catalogue facets. */
export async function drugGroupCounts(
  supabase: SupabaseClient
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  await Promise.all(
    ATC_GROUPS.map(async (g) => {
      const { count } = await supabase
        .from("Drug")
        .select("id", { count: "exact", head: true })
        .eq("anatomicalCode", g.code);
      out[g.code] = count ?? 0;
    })
  );
  return out;
}
