import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  Phone,
  Repeat2,
  Stethoscope,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createPharmacySource,
  deliveryLabel,
  orderRef,
} from "@/lib/data/pharmacy-source";
import { StatusPill } from "@/components/pharmacy/console-ui";
import { FulfilmentPanel } from "@/components/pharmacy/fulfilment-panel";

export const metadata: Metadata = { title: "Order · Nirog Pharmacy" };
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ps = createPharmacySource(await createClient());
  const order = await ps.getOrder(id);
  if (!order) notFound();
  const events = await ps.getOrderEvents(id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/pharmacy/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> Command centre
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tnum font-mono text-xs font-semibold text-blue">
            {orderRef(order.id)}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">
            {order.patientName}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {[order.patientVillage, order.patientDistrict]
                .filter(Boolean)
                .join(", ") || "Location not set"}
            </span>
            {order.patientPhone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3" /> {order.patientPhone}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Truck className="size-3" /> {deliveryLabel(order.deliveryMode)}
            </span>
          </p>
        </div>
        <StatusPill status={order.status} live={order.status === "routed"} />
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* prescription */}
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-hairline bg-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-ink">
                Prescription
              </h2>
              <span className="text-[11px] text-ink-faint">
                Issued {new Date(order.issuedAt).toLocaleString()}
              </span>
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
              <Stethoscope className="size-3.5 text-ink-faint" />
              {order.doctorName}
              {order.doctorRegNo && (
                <span className="text-ink-faint">· {order.doctorRegNo}</span>
              )}
            </p>

            <ul className="mt-4 flex flex-col gap-3">
              {order.items.map((i, n) => (
                <li
                  key={i.id}
                  className="rounded-xl border border-hairline bg-panel-2 p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-ink">
                        <span className="tnum mr-2 text-ink-faint">
                          {String(n + 1).padStart(2, "0")}
                        </span>
                        {i.drugName}
                        {i.strength && (
                          <span className="ml-1.5 font-semibold text-ink-soft">
                            {i.strength}
                          </span>
                        )}
                      </p>
                      {i.atcCode && (
                        <p className="tnum mt-1 font-mono text-[11px] text-blue">
                          ATC {i.atcCode}
                          {i.form ? ` · ${i.form}` : ""}
                        </p>
                      )}
                    </div>
                    {i.substitutionAllowed ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-soft-green px-2 py-1 text-[10px] font-semibold text-green">
                        <Repeat2 className="size-3" /> Generic OK
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-soft-amber px-2 py-1 text-[10px] font-semibold text-amber">
                        Dispense as written
                      </span>
                    )}
                  </div>

                  <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
                    <Fact k="Dose" v={i.dose} />
                    <Fact k="Frequency" v={i.frequency} />
                    <Fact
                      k="Duration"
                      v={i.durationDays ? `${i.durationDays} days` : undefined}
                    />
                    <Fact k="Quantity" v={i.quantity?.toString()} />
                  </dl>

                  {i.instructions && (
                    <p className="mt-2 rounded-lg bg-panel px-2.5 py-1.5 text-xs text-ink-soft">
                      {i.instructions}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            {order.notes && (
              <p className="mt-4 rounded-xl bg-soft-blue px-3 py-2.5 text-xs text-ink">
                <span className="font-semibold">Note to pharmacist: </span>
                {order.notes}
              </p>
            )}
          </section>

          {/* trail */}
          <section className="rounded-2xl border border-hairline bg-panel p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-ink">
              <ClipboardList className="size-4 text-ink-faint" /> Fulfilment trail
            </h2>
            {events.length === 0 ? (
              <p className="mt-3 text-xs text-ink-faint">
                No activity yet — accepting this order starts the trail.
              </p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2.5">
                {events.map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5 text-xs">
                    <StatusPill status={e.status} className="shrink-0" />
                    <div className="min-w-0">
                      {e.note && <p className="text-ink-soft">{e.note}</p>}
                      <p className="text-ink-faint">
                        {e.actor} · {new Date(e.at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-3 border-t border-hairline pt-3 text-[10px] text-ink-faint">
              Append-only. Entries cannot be edited or removed.
            </p>
          </section>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <FulfilmentPanel order={order} />
        </div>
      </div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v?: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
        {k}
      </dt>
      <dd className="text-xs font-medium text-ink">{v || "—"}</dd>
    </div>
  );
}
