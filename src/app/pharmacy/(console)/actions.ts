"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createPharmacySource } from "@/lib/data/pharmacy-source";
import type { OrderStatus } from "@/lib/domain/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const STATUSES = [
  "routed",
  "accepted",
  "preparing",
  "ready",
  "dispatched",
  "delivered",
  "rejected",
  "cancelled",
] as const;

const advanceSchema = z.object({
  orderId: z.string().min(1),
  next: z.enum(STATUSES),
  note: z.string().max(400).optional(),
  totalAmount: z.number().int().min(0).max(10_000_000).optional(),
});

async function source() {
  return createPharmacySource(await createClient());
}

/** Claim an order out of the district pool. */
export async function claimOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const ps = await source();
    const claimed = await ps.claimOrder(orderId);
    if (!claimed) {
      return {
        ok: false,
        error: "Another pharmacy accepted this order first.",
      };
    }
    revalidatePath("/pharmacy/dashboard");
    revalidatePath("/pharmacy/orders");
    return { ok: true };
  } catch (err) {
    console.error("[nirog] claimOrder failed:", err);
    return { ok: false, error: "Could not accept the order. Please retry." };
  }
}

/** Step an order along the fulfilment state machine. */
export async function advanceOrderAction(input: {
  orderId: string;
  next: OrderStatus;
  note?: string;
  totalAmount?: number;
}): Promise<ActionResult> {
  const parsed = advanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  try {
    const ps = await source();
    const res = await ps.advanceOrder(parsed.data.orderId, parsed.data.next, {
      note: parsed.data.note,
      totalAmount: parsed.data.totalAmount,
    });
    if (!res.ok) return { ok: false, error: res.reason };
    revalidatePath("/pharmacy/dashboard");
    revalidatePath("/pharmacy/orders");
    revalidatePath(`/pharmacy/orders/${parsed.data.orderId}`);
    return { ok: true };
  } catch (err) {
    console.error("[nirog] advanceOrder failed:", err);
    return { ok: false, error: "Could not update the order. Please retry." };
  }
}
