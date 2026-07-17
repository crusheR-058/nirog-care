/**
 * Authenticated Supabase implementation of NirogDataSource.
 *
 * Every query runs through the signed-in doctor's session (the `authenticated`
 * role), so Row-Level Security enforces per-doctor and per-consent access in
 * the database itself — the app cannot read what the policies forbid.
 *
 * Note: Prisma's @default(cuid()/now()) are client-side, so inserts made here
 * via PostgREST must supply ids and timestamps explicitly.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AriaHandover,
  AuditEvent,
  DashboardStats,
  Doctor,
  Encounter,
  PatientChart,
  Vitals,
} from "@/lib/domain/types";
import type {
  NirogDataSource,
  PatientListItem,
  QueueItemView,
  SaveEncounterInput,
} from "@/lib/data/source";
import { minutesSince } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function ageFromDob(dob: string, now: Date): number {
  const b = new Date(dob);
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function uid(): string {
  return crypto.randomUUID();
}

const TRIAGE_RANK = { emergency: 0, urgent: 1, routine: 2 } as const;
const STATE_RANK: Record<string, number> = {
  waiting: 0,
  in_consult: 0,
  scheduled: 1,
  completed: 2,
  no_show: 3,
};

export function createSupabaseDataSource(
  supabase: SupabaseClient
): NirogDataSource {
  let doctorRow: Row | undefined;

  async function doctor(): Promise<Row> {
    if (doctorRow) return doctorRow;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("Doctor")
      .select("*")
      .eq("authUserId", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("No clinician profile linked to this account.");
    doctorRow = data;
    return data;
  }

  function mapDoctor(d: Row): Doctor {
    return {
      id: d.id,
      fullName: d.fullName,
      email: d.email,
      specialty: d.specialty,
      registrationNo: d.registrationNo,
      languages: d.languages ?? [],
      clinicName: d.clinicName,
      mfaEnabled: d.mfaEnabled,
      avatarTone: d.avatarTone ?? undefined,
      onboardingComplete: d.onboardingComplete ?? false,
      country: d.country ?? undefined,
    };
  }

  function mapHandover(h: Row): AriaHandover {
    return {
      id: h.id,
      patientId: h.patientId,
      createdAt: h.createdAt,
      chiefComplaint: h.chiefComplaint,
      narrative: h.narrative,
      durationText: h.durationText,
      symptoms: h.symptoms ?? [],
      redFlags: h.redFlags ?? [],
      vitals: (h.vitals as Vitals | null) ?? undefined,
      aiConfidence: h.aiConfidence,
      suggestedTriage: h.suggestedTriage,
      language: h.language,
      verifiedByDoctor: h.verifiedByDoctor,
    };
  }

  function mapEncounter(e: Row): Encounter {
    return {
      id: e.id,
      patientId: e.patientId,
      doctorId: e.doctorId,
      startedAt: e.startedAt,
      endedAt: e.endedAt ?? undefined,
      channel: e.channel,
      chiefComplaint: e.chiefComplaint,
      assessment: e.assessment,
      clinicalNotes: e.clinicalNotes,
      prescriptions: e.prescriptions ?? [],
      labRequests: e.labRequests ?? [],
      followUp: e.followUp ?? undefined,
      ariaAccepted: e.ariaAccepted,
    };
  }

  async function queueView(): Promise<QueueItemView[]> {
    const d = await doctor();
    const now = new Date();
    const { data, error } = await supabase
      .from("QueueEntry")
      .select(
        "*, patient:Patient(fullName,dateOfBirth,avatarTone), handover:AriaHandover(redFlags)"
      )
      .eq("doctorId", d.id);
    if (error) throw error;
    return (data ?? [])
      .map((q: Row) => ({
        id: q.id,
        patientId: q.patientId,
        doctorId: q.doctorId,
        kind: q.kind,
        triage: q.triage,
        state: q.state,
        checkedInAt: q.checkedInAt,
        scheduledFor: q.scheduledFor,
        channel: q.channel,
        reason: q.reason,
        handoverId: q.handoverId ?? undefined,
        connectionQuality: q.connectionQuality,
        patientName: q.patient?.fullName ?? "Unknown",
        patientAge: q.patient ? ageFromDob(q.patient.dateOfBirth, now) : 0,
        patientAvatarTone: q.patient?.avatarTone ?? undefined,
        redFlagCount: q.handover?.redFlags?.length ?? 0,
        waitingMinutes:
          q.state === "waiting" ? minutesSince(q.checkedInAt, now) : 0,
      }))
      .sort(
        (a: QueueItemView, b: QueueItemView) =>
          STATE_RANK[a.state] - STATE_RANK[b.state] ||
          TRIAGE_RANK[a.triage] - TRIAGE_RANK[b.triage] ||
          new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime()
      );
  }

  return {
    async getDoctor(): Promise<Doctor> {
      return mapDoctor(await doctor());
    },

    async getQueue(): Promise<QueueItemView[]> {
      return queueView();
    },

    async getQueueItem(id: string): Promise<QueueItemView | null> {
      const all = await queueView();
      return all.find((q) => q.id === id) ?? null;
    },

    async getDashboardStats(): Promise<DashboardStats> {
      const view = await queueView();
      const waiting = view.filter((q) => q.state === "waiting");
      return {
        waiting: waiting.length,
        scheduledToday: view.filter((q) => q.state === "scheduled").length,
        completedToday: view.filter((q) => q.state === "completed").length,
        emergencies: waiting.filter((q) => q.triage === "emergency").length,
        avgWaitMin:
          waiting.length === 0
            ? 0
            : Math.round(
                waiting.reduce((s, q) => s + q.waitingMinutes, 0) /
                  waiting.length
              ),
      };
    },

    async getPatients(): Promise<PatientListItem[]> {
      const d = await doctor();
      const now = new Date();
      const [patients, activeQueue, consents] = await Promise.all([
        supabase.from("Patient").select("*").order("fullName"),
        supabase
          .from("QueueEntry")
          .select("patientId")
          .eq("doctorId", d.id)
          .in("state", ["waiting", "scheduled"]),
        supabase
          .from("ConsentGrant")
          .select("patientId")
          .eq("grantedTo", d.id)
          .eq("active", true),
      ]);
      if (patients.error) throw patients.error;
      const inQueue = new Set(
        (activeQueue.data ?? []).map((q: Row) => q.patientId)
      );
      const consented = new Set(
        (consents.data ?? []).map((c: Row) => c.patientId)
      );
      return (patients.data ?? []).map((p: Row) => ({
        id: p.id,
        fullName: p.fullName,
        age: ageFromDob(p.dateOfBirth, now),
        sex: p.sex,
        village: p.village,
        district: p.district,
        conditions: p.conditions ?? [],
        avatarTone: p.avatarTone ?? undefined,
        abhaLinked: p.abhaLinked,
        consentActive: consented.has(p.id),
        inQueue: inQueue.has(p.id),
      }));
    },

    async getPatientChart(patientId: string): Promise<PatientChart | null> {
      const [patient, handover, encounters, consent] = await Promise.all([
        supabase.from("Patient").select("*").eq("id", patientId).maybeSingle(),
        supabase
          .from("AriaHandover")
          .select("*")
          .eq("patientId", patientId)
          .order("createdAt", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("Encounter")
          .select("*")
          .eq("patientId", patientId)
          .order("startedAt", { ascending: false }),
        supabase
          .from("ConsentGrant")
          .select("*")
          .eq("patientId", patientId)
          .limit(1)
          .maybeSingle(),
      ]);
      if (!patient.data) return null;
      const p = patient.data;
      return {
        patient: {
          id: p.id,
          fullName: p.fullName,
          sex: p.sex,
          dateOfBirth: p.dateOfBirth,
          phoneMasked: p.phoneMasked,
          village: p.village,
          district: p.district,
          preferredLanguage: p.preferredLanguage,
          abhaLinked: p.abhaLinked,
          relationshipToAccount: p.relationshipToAccount,
          allergies: p.allergies ?? [],
          conditions: p.conditions ?? [],
          currentMedications: p.currentMedications ?? [],
          avatarTone: p.avatarTone ?? undefined,
        },
        handover: handover.data ? mapHandover(handover.data) : undefined,
        history: (encounters.data ?? []).map(mapEncounter),
        consent: consent.data
          ? {
              id: consent.data.id,
              patientId: consent.data.patientId,
              grantedTo: consent.data.grantedTo,
              purpose: consent.data.purpose,
              scope: consent.data.scope ?? [],
              grantedAt: consent.data.grantedAt,
              expiresAt: consent.data.expiresAt,
              active: consent.data.active,
            }
          : undefined,
      };
    },

    async getRecentAudit(limit = 8): Promise<AuditEvent[]> {
      const { data, error } = await supabase
        .from("AuditEvent")
        .select("*")
        .order("at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((a: Row) => ({
        id: a.id,
        actorId: a.actorId ?? "",
        actorName: a.actorName,
        action: a.action,
        target: a.target,
        reason: a.reason ?? undefined,
        at: a.at,
      }));
    },

    async acceptHandover(handoverId: string): Promise<void> {
      const d = await doctor();
      const upd = await supabase
        .from("AriaHandover")
        .update({ verifiedByDoctor: true })
        .eq("id", handoverId);
      if (upd.error) throw upd.error;
      await supabase.from("AuditEvent").insert({
        id: uid(),
        actorId: d.id,
        actorName: d.fullName,
        action: "Accepted ARIA handover",
        target: handoverId,
        at: new Date().toISOString(),
      });
    },

    async saveEncounter(input: SaveEncounterInput): Promise<Encounter> {
      const d = await doctor();
      const now = new Date().toISOString();
      const id = uid();
      const insert = await supabase
        .from("Encounter")
        .insert({
          id,
          patientId: input.patientId,
          doctorId: d.id,
          startedAt: now,
          endedAt: now,
          channel: input.channel,
          chiefComplaint: input.chiefComplaint,
          assessment: input.assessment,
          clinicalNotes: input.clinicalNotes,
          prescriptions: input.prescriptions,
          labRequests: input.labRequests,
          followUp: input.followUp ?? null,
          ariaAccepted: input.ariaAccepted,
        })
        .select("*")
        .single();
      if (insert.error) throw insert.error;

      await supabase
        .from("QueueEntry")
        .update({ state: "completed" })
        .eq("id", input.queueId);

      await supabase.from("AuditEvent").insert({
        id: uid(),
        actorId: d.id,
        actorName: d.fullName,
        action: "Filed encounter note",
        target: input.patientId,
        reason: input.chiefComplaint,
        at: now,
      });

      return mapEncounter(insert.data);
    },
  };
}
