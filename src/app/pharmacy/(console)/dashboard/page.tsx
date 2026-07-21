import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  ACTIVE_STATUSES,
  createPharmacySource,
} from "@/lib/data/pharmacy-source";
import { StatTile } from "@/components/pharmacy/console-ui";
import { OrderBoard } from "@/components/pharmacy/order-board";

export const metadata: Metadata = { title: "Command · Nirog Pharmacy" };
export const dynamic = "force-dynamic";

export default async function PharmacyDashboard() {
  const ps = createPharmacySource(await createClient());
  const [me, stats, pool, active] = await Promise.all([
    ps.identity(),
    ps.getStats(),
    ps.getPool(),
    ps.getOrders(ACTIVE_STATUSES),
  ]);

  // District values are often already fully qualified ("Barabanki, UP"), so
  // naively joining district + state prints "Barabanki, UP, UP".
  const serving =
    [me.district, me.state, me.country]
      .filter(Boolean)
      .filter(
        (part, i, all) =>
          !all.some(
            (other, j) =>
              j < i && other!.toLowerCase().includes(part!.toLowerCase())
          )
      )
      .join(", ") || "your area";

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-cyan">
            <span className="live-dot inline-block size-1.5 rounded-full bg-cyan" />
            Live · dispensing console
          </p>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Command centre
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Serving {serving} · prescriptions route here the moment a clinician
            files them.
          </p>
        </div>
        <Link
          href="/pharmacy/orders"
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-panel-2"
        >
          All orders <ArrowRight className="size-3.5" />
        </Link>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label="Incoming"
          value={stats.incoming}
          hint="Unclaimed in your district"
          accent="cyan"
          index={0}
        />
        <StatTile
          label="In fulfilment"
          value={stats.active}
          hint="Accepted, not yet delivered"
          accent="blue"
          index={1}
        />
        <StatTile
          label="Out for delivery"
          value={stats.dispatched}
          hint="On the road now"
          accent="aria"
          index={2}
        />
        <StatTile
          label="Delivered 24 h"
          value={stats.deliveredToday}
          hint="Completed today"
          accent="green"
          index={3}
        />
        <StatTile
          label="Avg. accept"
          value={stats.avgAcceptMin ? `${stats.avgAcceptMin}m` : "—"}
          hint="Routed → accepted"
          accent="amber"
          index={4}
        />
      </div>

      <OrderBoard pool={pool} active={active} />

      <p className="mt-8 flex items-center justify-center gap-2 text-[11px] text-ink-faint">
        <Activity className="size-3.5" />
        Dispensing {stats.lines30d} medication line
        {stats.lines30d === 1 ? "" : "s"} over the last 30 days
      </p>
    </div>
  );
}
