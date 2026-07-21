"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDataSource, type SaveEncounterInput } from "@/lib/data/source";

const prescriptionSchema = z.object({
  id: z.string(),
  drug: z.string().min(1),
  strength: z.string(),
  form: z.string(),
  dose: z.string(),
  frequency: z.string(),
  durationDays: z.number().int().nonnegative(),
  notes: z.string().optional(),
  // Set when the line was picked from the WHO ATC catalogue rather than typed
  // free-hand. Zod strips unknown keys, so these must be declared or the code
  // never reaches the dispensing pharmacy.
  atcCode: z.string().optional(),
  drugId: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  substitutionAllowed: z.boolean().optional(),
});

const labSchema = z.object({
  id: z.string(),
  test: z.string().min(1),
  priority: z.enum(["routine", "urgent"]),
  reason: z.string().optional(),
});

const saveSchema = z.object({
  patientId: z.string(),
  queueId: z.string(),
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  assessment: z.string().min(1, "An assessment is required before filing"),
  clinicalNotes: z.string(),
  channel: z.enum(["video", "audio", "chat"]),
  prescriptions: z.array(prescriptionSchema),
  labRequests: z.array(labSchema),
  followUp: z
    .object({
      inDays: z.number().int().positive(),
      channel: z.enum(["video", "audio", "chat"]),
      instructions: z.string(),
    })
    .optional(),
  ariaAccepted: z.boolean(),
});

export type SaveResult =
  | { ok: true; encounterId: string }
  | { ok: false; error: string };

async function requireDoctor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function acceptHandoverAction(handoverId: string) {
  await requireDoctor();
  const ds = await getDataSource();
  await ds.acceptHandover(handoverId);
  revalidatePath("/portal");
}

/** Toggle the doctor's on-call availability (enters/leaves the matching pool). */
export async function setOnCallAction(on: boolean) {
  await requireDoctor();
  const ds = await getDataSource();
  await ds.setOnCall(on);
  revalidatePath("/portal");
}

/** Lightweight availability heartbeat, called on an interval while on call. */
export async function heartbeatAction() {
  await requireDoctor();
  const ds = await getDataSource();
  await ds.heartbeat();
}

/**
 * Accept an incoming pool request. Returns whether THIS doctor got it — the
 * claim is atomic, so a losing race returns claimed:false (someone else took it).
 */
export async function claimQueueAction(
  queueId: string
): Promise<{ ok: true; claimed: boolean }> {
  await requireDoctor();
  const ds = await getDataSource();
  const claimed = await ds.claimQueueItem(queueId);
  revalidatePath("/portal");
  return { ok: true, claimed };
}

export async function saveEncounterAction(
  input: SaveEncounterInput
): Promise<SaveResult> {
  await requireDoctor();
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid encounter",
    };
  }
  const ds = await getDataSource();
  const encounter = await ds.saveEncounter(parsed.data);
  revalidatePath("/portal");
  revalidatePath(`/portal/patients/${input.patientId}`);
  return { ok: true, encounterId: encounter.id };
}
