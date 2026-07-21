import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchDrugs } from "@/lib/data/drugs";

export const dynamic = "force-dynamic";

/**
 * Typeahead over the WHO ATC catalogue.
 *
 * Runs on the caller's session, so the `drug_select_all` policy (authenticated
 * only) is what gates it — an anonymous request gets nothing back.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ drugs: [] }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim() ?? "";
  const group = params.get("group") ?? undefined;
  const limit = Math.min(25, Math.max(1, Number(params.get("limit")) || 12));

  // Below two characters the result set is meaningless and the query is a
  // full scan — make the client show its hint instead.
  if (q.length < 2 && !group) return NextResponse.json({ drugs: [] });

  try {
    const { drugs } = await searchDrugs(supabase, { query: q, group, limit });
    return NextResponse.json({ drugs });
  } catch (err) {
    console.error("[nirog] drug search failed:", err);
    return NextResponse.json({ drugs: [], error: "search_failed" }, { status: 500 });
  }
}
