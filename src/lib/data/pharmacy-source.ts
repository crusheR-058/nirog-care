/**
 * Pharmacy-side data access — the "Fulfil" step of the care loop.
 *
 * Every query runs through the signed-in pharmacy's session, so RLS
 * (supabase/fulfilment.sql) is what actually enforces the boundary: a pharmacy
 * can read the unassigned pool for the districts it serves, plus the orders it
 * holds, and nothing clinical. This module never uses the service role.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DeliveryMode,
  OrderEvent,
  OrderStatus,
  PharmacyOrderView,
  PharmacyStats,
  PrescriptionItem,
} from "@/lib/domain/types";
import { minutesSince } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

/**
 * The fulfilment state machine. A pharmacy may only step an order along one of
 * these edges — enforced server-side in advanceOrder(), so a crafted request
 * can't jump an order straight to `delivered`.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  routed: ["accepted", "rejected"],
  accepted: ["preparing", "rejected", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["dispatched", "delivered", "cancelled"],
  dispatched: ["delivered"],
  delivered: [],
  rejected: [],
  cancelled: [],
};

export const ORDER_LABEL: Record<OrderStatus, string> = {
  routed: "Incoming",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  dispatched: "Out for delivery",
  delivered: "Delivered",
  rejected: "Declined",
  cancelled: "Cancelled",
};

/** Statuses that still need work from the pharmacy. */
export const ACTIVE_STATUSES: OrderStatus[] = [
  "accepted",
  "preparing",
  "ready",
  "dispatched",
];

const ORDER_SELECT = `
  id,prescriptionId,pharmacyId,status,deliveryMode,district,state,country,
  patientName,patientPhone,patientVillage,patientDistrict,
  routedAt,acceptedAt,dispatchedAt,deliveredAt,rejectionReason,totalAmount,
  prescription:Prescription(
    id,issuedAt,notes,doctorName,doctorRegNo,
    items:PrescriptionItem(
      id,drugId,drugName,atcCode,strength,form,dose,frequency,
      durationDays,quantity,instructions,substitutionAllowed
    )
  )
`;

function mapItem(i: Row): PrescriptionItem {
  return {
    id: i.id,
    drugId: i.drugId ?? undefined,
    drugName: i.drugName,
    atcCode: i.atcCode ?? undefined,
    strength: i.strength ?? undefined,
    form: i.form ?? undefined,
    dose: i.dose ?? undefined,
    frequency: i.frequency ?? undefined,
    durationDays: i.durationDays ?? undefined,
    quantity: i.quantity ?? undefined,
    instructions: i.instructions ?? undefined,
    substitutionAllowed: i.substitutionAllowed ?? true,
  };
}

function mapOrder(o: Row, now: Date): PharmacyOrderView {
  const p = o.prescription ?? {};
  return {
    id: o.id,
    prescriptionId: o.prescriptionId,
    pharmacyId: o.pharmacyId ?? undefined,
    status: o.status,
    deliveryMode: o.deliveryMode,
    district: o.district ?? undefined,
    state: o.state ?? undefined,
    country: o.country ?? undefined,
    patientName: o.patientName,
    patientPhone: o.patientPhone ?? undefined,
    patientVillage: o.patientVillage ?? undefined,
    patientDistrict: o.patientDistrict ?? undefined,
    routedAt: o.routedAt,
    acceptedAt: o.acceptedAt ?? undefined,
    dispatchedAt: o.dispatchedAt ?? undefined,
    deliveredAt: o.deliveredAt ?? undefined,
    rejectionReason: o.rejectionReason ?? undefined,
    totalAmount: o.totalAmount ?? undefined,
    doctorName: p.doctorName ?? "Nirog clinician",
    doctorRegNo: p.doctorRegNo ?? "",
    issuedAt: p.issuedAt ?? o.routedAt,
    notes: p.notes ?? undefined,
    items: (p.items ?? []).map(mapItem),
    waitingMinutes: minutesSince(o.routedAt, now),
  };
}

export interface PharmacyIdentity {
  id: string;
  name: string;
  verified: boolean;
  district?: string;
  state?: string;
  country?: string;
}

export function createPharmacySource(supabase: SupabaseClient) {
  let cached: Row | undefined;

  async function me(): Promise<Row> {
    if (cached) return cached;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("Pharmacy")
      .select("*")
      .eq("authUserId", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("No pharmacy profile linked to this account.");
    cached = data;
    return data;
  }

  return {
    async identity(): Promise<PharmacyIdentity> {
      const p = await me();
      return {
        id: p.id,
        name: p.name,
        verified: p.verified ?? false,
        district: p.district ?? undefined,
        state: p.state ?? undefined,
        country: p.country ?? undefined,
      };
    },

    /**
     * Unclaimed orders routed to a district this pharmacy serves. RLS decides
     * membership (pharmacy_serves + verified) — this query cannot widen it.
     */
    async getPool(): Promise<PharmacyOrderView[]> {
      const now = new Date();
      const { data, error } = await supabase
        .from("PharmacyOrder")
        .select(ORDER_SELECT)
        .is("pharmacyId", null)
        .eq("status", "routed")
        .order("routedAt", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((o: Row) => mapOrder(o, now));
    },

    /** Orders this pharmacy holds, newest activity first. */
    async getOrders(statuses?: OrderStatus[]): Promise<PharmacyOrderView[]> {
      const p = await me();
      const now = new Date();
      let q = supabase
        .from("PharmacyOrder")
        .select(ORDER_SELECT)
        .eq("pharmacyId", p.id);
      if (statuses?.length) q = q.in("status", statuses);
      const { data, error } = await q.order("routedAt", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((o: Row) => mapOrder(o, now));
    },

    async getOrder(id: string): Promise<PharmacyOrderView | null> {
      const now = new Date();
      const { data, error } = await supabase
        .from("PharmacyOrder")
        .select(ORDER_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapOrder(data, now) : null;
    },

    async getOrderEvents(orderId: string): Promise<OrderEvent[]> {
      const { data, error } = await supabase
        .from("OrderEvent")
        .select("*")
        .eq("orderId", orderId)
        .order("at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((e: Row) => ({
        id: e.id,
        orderId: e.orderId,
        status: e.status,
        note: e.note ?? undefined,
        actor: e.actor,
        at: e.at,
      }));
    },

    /**
     * Atomically claim an order from the pool. The guards mirror the RLS USING
     * clause, so two pharmacies racing on the same order produce exactly one
     * winner: the loser's UPDATE matches 0 rows.
     */
    async claimOrder(orderId: string): Promise<boolean> {
      const p = await me();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("PharmacyOrder")
        .update({ pharmacyId: p.id, status: "accepted", acceptedAt: now })
        .eq("id", orderId)
        .is("pharmacyId", null)
        .eq("status", "routed")
        .select("id");
      if (error) throw error;
      const claimed = (data?.length ?? 0) > 0;
      if (claimed) {
        await supabase.from("OrderEvent").insert({
          id: crypto.randomUUID(),
          orderId,
          status: "accepted",
          actor: p.name,
          note: "Order accepted for fulfilment",
          at: now,
        });
      }
      return claimed;
    },

    /**
     * Step an order along the fulfilment state machine. Rejects any transition
     * not declared in ORDER_TRANSITIONS.
     */
    async advanceOrder(
      orderId: string,
      next: OrderStatus,
      opts: { note?: string; totalAmount?: number } = {}
    ): Promise<{ ok: boolean; reason?: string }> {
      const p = await me();
      const { data: current, error: readErr } = await supabase
        .from("PharmacyOrder")
        .select("id,status,pharmacyId")
        .eq("id", orderId)
        .maybeSingle();
      if (readErr) throw readErr;
      if (!current) return { ok: false, reason: "Order not found." };
      if (current.pharmacyId !== p.id)
        return { ok: false, reason: "This order belongs to another pharmacy." };

      const allowed = ORDER_TRANSITIONS[current.status as OrderStatus] ?? [];
      if (!allowed.includes(next))
        return {
          ok: false,
          reason: `Cannot move from ${ORDER_LABEL[current.status as OrderStatus]} to ${ORDER_LABEL[next]}.`,
        };

      const now = new Date().toISOString();
      const patch: Row = { status: next };
      if (next === "dispatched") patch.dispatchedAt = now;
      if (next === "delivered") patch.deliveredAt = now;
      if (next === "rejected") patch.rejectionReason = opts.note ?? "Declined";
      if (opts.totalAmount != null) patch.totalAmount = opts.totalAmount;

      // Declining releases the order back to the pool so another pharmacy in
      // the district can pick it up — a rejected order must not be a dead end.
      if (next === "rejected") {
        patch.pharmacyId = null;
        patch.status = "routed";
        patch.acceptedAt = null;
      }

      const { error } = await supabase
        .from("PharmacyOrder")
        .update(patch)
        .eq("id", orderId)
        .eq("pharmacyId", p.id);
      if (error) throw error;

      await supabase.from("OrderEvent").insert({
        id: crypto.randomUUID(),
        orderId,
        status: next,
        actor: p.name,
        note: opts.note ?? null,
        at: now,
      });

      // Note: closing the Prescription (status → fulfilled) on delivery is done
      // by the `pharmacy_order_status_sync` trigger, not here. Only the
      // prescribing doctor may UPDATE a Prescription under RLS, so an app-level
      // write from the pharmacy session fails silently.
      return { ok: true };
    },

    async getStats(): Promise<PharmacyStats> {
      const p = await me();
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 864e5).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 864e5).toISOString();

      const [pool, mine, deliveredToday, lines] = await Promise.all([
        supabase
          .from("PharmacyOrder")
          .select("id", { count: "exact", head: true })
          .is("pharmacyId", null)
          .eq("status", "routed"),
        supabase
          .from("PharmacyOrder")
          .select("status,routedAt,acceptedAt")
          .eq("pharmacyId", p.id),
        supabase
          .from("PharmacyOrder")
          .select("id", { count: "exact", head: true })
          .eq("pharmacyId", p.id)
          .eq("status", "delivered")
          .gte("deliveredAt", dayAgo),
        supabase
          .from("PharmacyOrder")
          .select("prescription:Prescription(items:PrescriptionItem(id))")
          .eq("pharmacyId", p.id)
          .gte("routedAt", monthAgo),
      ]);

      const rows: Row[] = mine.data ?? [];
      const accepted = rows.filter((r) => r.acceptedAt);
      const avgAcceptMin = accepted.length
        ? Math.round(
            accepted.reduce(
              (s, r) =>
                s +
                (new Date(r.acceptedAt).getTime() -
                  new Date(r.routedAt).getTime()) /
                  60000,
              0
            ) / accepted.length
          )
        : 0;

      return {
        incoming: pool.count ?? 0,
        active: rows.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
        dispatched: rows.filter((r) => r.status === "dispatched").length,
        deliveredToday: deliveredToday.count ?? 0,
        avgAcceptMin,
        lines30d: (lines.data ?? []).reduce(
          (s: number, o: Row) => s + (o.prescription?.items?.length ?? 0),
          0
        ),
      };
    },
  };
}

export type PharmacySource = ReturnType<typeof createPharmacySource>;

export function deliveryLabel(m: DeliveryMode): string {
  return m === "pickup" ? "Counter pickup" : "Home delivery";
}

/**
 * A short, speakable handle for an order — pharmacists read these across a
 * counter, where a raw cuid is useless. Derived, never stored.
 *
 * Lives here rather than in a component module because both server pages and
 * client components need it, and a function exported from a "use client" file
 * cannot be called during a server render.
 */
export function orderRef(id: string): string {
  return `RX-${id.slice(-6).toUpperCase()}`;
}
