// Nirog patient app — create a consult request (the seam to the doctor portal).
// After ARIA finishes the intake, the app writes an AriaHandover + a QueueEntry
// with doctorId = null (the on-demand pool). Every on-call doctor's portal then
// shows it live; the first to Accept claims it atomically and the call opens.
//
// The doctor portal reads THIS exact row (src/lib/data/supabase-source.ts →
// getPoolQueue / claimQueueItem). RLS (queue_insert_own_account) lets the
// account insert only for its own patients.
import { supabase } from "./supabase";

// Prisma @default(cuid()/now()) are client-side, so PostgREST inserts must
// supply id + timestamps explicitly — same rule the portal follows.
const uid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export interface AriaResult {
  chiefComplaint: string;
  narrative: string;
  durationText: string;
  symptoms: string[];
  redFlags: string[];
  vitals?: Record<string, unknown>;
  aiConfidence: number; // 0..1
  suggestedTriage: "emergency" | "urgent" | "routine";
  language: string;
}

/** Returns the queueId — subscribe to it to detect pick-up (see useIncomingPickup). */
export async function requestConsult(
  patientId: string,
  aria: AriaResult,
  channel: "video" | "audio" | "chat" = "video"
): Promise<string> {
  const now = new Date().toISOString();
  const handoverId = uid();
  const queueId = uid();

  const h = await supabase.from("AriaHandover").insert({
    id: handoverId,
    patientId,
    createdAt: now,
    chiefComplaint: aria.chiefComplaint,
    narrative: aria.narrative,
    durationText: aria.durationText,
    symptoms: aria.symptoms,
    redFlags: aria.redFlags,
    vitals: aria.vitals ?? null,
    aiConfidence: aria.aiConfidence,
    suggestedTriage: aria.suggestedTriage,
    language: aria.language,
  });
  if (h.error) throw h.error;

  const q = await supabase.from("QueueEntry").insert({
    id: queueId,
    patientId,
    doctorId: null, // ← on-demand pool; a doctor claims it
    kind: "new",
    triage: aria.suggestedTriage,
    state: "waiting",
    checkedInAt: now,
    scheduledFor: now,
    channel,
    reason: aria.chiefComplaint,
    handoverId,
    connectionQuality: "good",
  });
  if (q.error) throw q.error;

  return queueId;
}

/** Cancel a request that hasn't been picked up yet. */
export async function cancelConsult(queueId: string) {
  await supabase
    .from("QueueEntry")
    .update({ state: "no_show" })
    .eq("id", queueId)
    .eq("state", "waiting");
}
