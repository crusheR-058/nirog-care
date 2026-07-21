import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createPharmacySource, orderRef } from "@/lib/data/pharmacy-source";
import type { OrderStatus } from "@/lib/domain/types";
import { EmptyState, StatusPill, elapsed } from "@/components/pharmacy/console-ui";

export const metadata: Metadata = { title: "Orders · Nirog Pharmacy" };
export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "In progress", statuses: ["accepted", "preparing", "ready", "dispatched"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const ps = createPharmacySource(await createClient());
  const orders = await ps.getOrders(active.statuses);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-4">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Orders
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Every prescription this pharmacy has accepted.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/pharmacy/orders?filter=${f.key}`}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              f.key === active.key
                ? "bg-blue text-white"
                : "border border-hairline bg-panel text-ink-soft hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No orders here yet"
          body="Accepted prescriptions appear in this list with their full dispensing history."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-panel">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-[11px] uppercase tracking-wider text-ink-faint">
                <th className="px-4 py-3 font-semibold">Ref</th>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                  Lines
                </th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">
                  Routed
                </th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-hairline last:border-0 transition-colors hover:bg-panel-2"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/pharmacy/orders/${o.id}`}
                      className="tnum font-mono text-xs font-semibold text-blue hover:underline"
                    >
                      {orderRef(o.id)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{o.patientName}</p>
                    <p className="text-xs text-ink-faint">
                      {[o.patientVillage, o.patientDistrict]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </td>
                  <td className="tnum hidden px-4 py-3 text-ink-soft sm:table-cell">
                    {o.items.length}
                  </td>
                  <td className="tnum hidden px-4 py-3 text-xs text-ink-faint md:table-cell">
                    {elapsed(o.waitingMinutes)} ago
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
