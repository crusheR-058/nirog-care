/**
 * Seed the WHO ATC/DDD drug catalogue.
 *
 * Source: the WHO Collaborating Centre for Drug Statistics Methodology ATC
 * index — the global standard for classifying drug substances. Five levels:
 *   A          anatomical main group      (14)
 *   A10        therapeutic subgroup
 *   A10B       pharmacological subgroup
 *   A10BA      chemical subgroup
 *   A10BA02    the substance (metformin)
 *
 * We flatten the hierarchy onto each substance so catalogue search and faceting
 * are a single indexed scan rather than four joins.
 *
 * Idempotent: ids are derived from the ATC code and inserted with upsert, so
 * re-running refreshes names/DDDs without duplicating rows.
 *
 *   pnpm db:seed:drugs
 */
import { createClient } from "@supabase/supabase-js";

const CSV_URL =
  process.env.ATC_CSV_URL ??
  "https://raw.githubusercontent.com/fabkury/atcd/master/WHO%20ATC-DDD%202021-12-03.csv";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env"
  );
  process.exit(1);
}

interface DrugRow {
  id: string;
  atcCode: string;
  name: string;
  anatomicalCode: string;
  anatomicalName: string;
  therapeuticCode: string;
  therapeuticName: string;
  pharmacologicalCode: string;
  pharmacologicalName: string;
  chemicalCode: string;
  chemicalName: string;
  ddd: number | null;
  dddUom: string | null;
  route: string | null;
  searchText: string;
}

/** Minimal RFC4180 line splitter — the WHO export quotes names containing commas. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

const na = (v?: string) => (!v || v === "NA" ? null : v);

async function main() {
  console.log(`Fetching WHO ATC index…`);
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`ATC download failed: HTTP ${res.status}`);
  const text = await res.text();

  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  const idx = (k: string) => header.indexOf(k);
  const [iCode, iName, iDdd, iUom, iRoute] = [
    idx("atc_code"),
    idx("atc_name"),
    idx("ddd"),
    idx("uom"),
    idx("adm_r"),
  ];
  if (iCode < 0 || iName < 0) throw new Error("Unexpected CSV columns");

  const rows = lines.slice(1).map(splitCsvLine);

  // Pass 1: every level's code → name, so substances can inherit their lineage.
  const names = new Map<string, string>();
  for (const r of rows) names.set(r[iCode]?.trim(), (r[iName] ?? "").trim());

  // Pass 2: emit one row per 7-character (substance) code. Where a substance
  // appears several times (one row per route/DDD), prefer the row carrying a DDD.
  const drugs = new Map<string, DrugRow>();
  for (const r of rows) {
    const code = r[iCode]?.trim();
    if (!code || code.length !== 7) continue;
    if (drugs.has(code) && !na(r[iDdd])) continue;

    const [anat, ther, pharm, chem] = [
      code.slice(0, 1),
      code.slice(0, 3),
      code.slice(0, 4),
      code.slice(0, 5),
    ];
    const name = (r[iName] ?? "").trim();
    const d: DrugRow = {
      id: `atc_${code}`,
      atcCode: code,
      name,
      anatomicalCode: anat,
      anatomicalName: names.get(anat) ?? "",
      therapeuticCode: ther,
      therapeuticName: names.get(ther) ?? "",
      pharmacologicalCode: pharm,
      pharmacologicalName: names.get(pharm) ?? "",
      chemicalCode: chem,
      chemicalName: names.get(chem) ?? "",
      ddd: na(r[iDdd]) ? Number(r[iDdd]) : null,
      dddUom: na(r[iUom]),
      route: na(r[iRoute]),
      searchText: "",
    };
    d.searchText = [
      d.name,
      d.atcCode,
      d.chemicalName,
      d.pharmacologicalName,
      d.therapeuticName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    drugs.set(code, d);
  }

  const all = [...drugs.values()].sort((a, b) =>
    a.atcCode.localeCompare(b.atcCode)
  );
  console.log(`Parsed ${all.length} drug substances.`);

  const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false },
  });

  const BATCH = 500;
  let done = 0;
  for (let i = 0; i < all.length; i += BATCH) {
    const chunk = all.slice(i, i + BATCH);
    const { error } = await supabase
      .from("Drug")
      .upsert(chunk, { onConflict: "atcCode" });
    if (error) throw error;
    done += chunk.length;
    process.stdout.write(`\r  seeded ${done}/${all.length}`);
  }

  const { count } = await supabase
    .from("Drug")
    .select("id", { count: "exact", head: true });
  console.log(`\nDone. Catalogue now holds ${count} substances.`);
}

main().catch((err) => {
  console.error("\nSeed failed:", err);
  process.exit(1);
});
