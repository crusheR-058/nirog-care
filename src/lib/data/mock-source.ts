/**
 * In-memory implementation of NirogDataSource.
 *
 * Holds mutable copies of the seed data so a demo can complete an encounter and
 * see the queue update within the session. State is per server process.
 */
import type {
  AriaHandover,
  AuditEvent,
  DashboardStats,
  Doctor,
  Encounter,
  PatientChart,
} from "@/lib/domain/types";
import {
  CONSENTS,
  DOCTOR,
  HANDOVERS,
  PAST_ENCOUNTERS,
  PATIENTS,
  buildQueue,
} from "@/lib/data/seed";
import type {
  NirogDataSource,
  PatientListItem,
  QueueItemView,
  SaveEncounterInput,
} from "@/lib/data/source";
import { minutesSince } from "@/lib/utils";

function ageFromDob(dob: string, now: Date): number {
  const birth = new Date(dob);
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function createMockDataSource(): NirogDataSource {
  // Mutable session state.
  const handovers: AriaHandover[] = HANDOVERS.map((h) => ({ ...h }));
  const encounters: Encounter[] = PAST_ENCOUNTERS.map((e) => ({ ...e }));
  let queue = buildQueue(new Date());
  const audit: AuditEvent[] = [
    {
      id: "aud_1",
      actorId: DOCTOR.id,
      actorName: DOCTOR.fullName,
      action: "Signed in",
      target: "Doctor portal",
      reason: "Start of clinic",
      at: new Date(Date.now() - 42 * 60000).toISOString(),
    },
    {
      id: "aud_2",
      actorId: DOCTOR.id,
      actorName: DOCTOR.fullName,
      action: "Viewed chart",
      target: "Lakshmi Bai",
      reason: "Scheduled follow-up",
      at: new Date(Date.now() - 40 * 60000).toISOString(),
    },
  ];

  function toView(now: Date): QueueItemView[] {
    return queue.map((q) => {
      const patient = PATIENTS.find((p) => p.id === q.patientId)!;
      const handover = handovers.find((h) => h.id === q.handoverId);
      return {
        ...q,
        patientName: patient.fullName,
        patientAge: ageFromDob(patient.dateOfBirth, now),
        patientAvatarTone: patient.avatarTone,
        redFlagCount: handover?.redFlags.length ?? 0,
        waitingMinutes:
          q.state === "waiting" ? minutesSince(q.checkedInAt, now) : 0,
      };
    });
  }

  return {
    async getDoctor(): Promise<Doctor> {
      return { ...DOCTOR };
    },

    async getDashboardStats(): Promise<DashboardStats> {
      const now = new Date();
      const view = toView(now);
      const waiting = view.filter((q) => q.state === "waiting");
      return {
        waiting: waiting.length,
        scheduledToday: view.filter((q) => q.state === "scheduled").length,
        completedToday: view.filter((q) => q.state === "completed").length,
        emergencies: view.filter(
          (q) => q.triage === "emergency" && q.state === "waiting"
        ).length,
        avgWaitMin:
          waiting.length === 0
            ? 0
            : Math.round(
                waiting.reduce((s, q) => s + q.waitingMinutes, 0) /
                  waiting.length
              ),
      };
    },

    async getQueue(): Promise<QueueItemView[]> {
      const rank = { emergency: 0, urgent: 1, routine: 2 } as const;
      const stateRank = {
        waiting: 0,
        in_consult: 0,
        scheduled: 1,
        completed: 2,
        no_show: 3,
      } as const;
      return toView(new Date()).sort(
        (a, b) =>
          stateRank[a.state] - stateRank[b.state] ||
          rank[a.triage] - rank[b.triage] ||
          new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime()
      );
    },

    async getQueueItem(id: string): Promise<QueueItemView | null> {
      return toView(new Date()).find((q) => q.id === id) ?? null;
    },

    async getPatients(): Promise<PatientListItem[]> {
      const now = new Date();
      const activeQueue = new Set(
        queue
          .filter((q) => q.state === "waiting" || q.state === "scheduled")
          .map((q) => q.patientId)
      );
      return PATIENTS.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        age: ageFromDob(p.dateOfBirth, now),
        sex: p.sex,
        village: p.village,
        district: p.district,
        conditions: p.conditions,
        avatarTone: p.avatarTone,
        abhaLinked: p.abhaLinked,
        consentActive: CONSENTS.find((c) => c.patientId === p.id)?.active ?? false,
        inQueue: activeQueue.has(p.id),
      }));
    },

    async getPatientChart(patientId: string): Promise<PatientChart | null> {
      const patient = PATIENTS.find((p) => p.id === patientId);
      if (!patient) return null;
      return {
        patient: { ...patient },
        handover: handovers.find((h) => h.patientId === patientId),
        history: encounters
          .filter((e) => e.patientId === patientId)
          .sort(
            (a, b) =>
              new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
          ),
        consent: CONSENTS.find((c) => c.patientId === patientId),
      };
    },

    async getRecentAudit(limit = 8): Promise<AuditEvent[]> {
      return audit
        .slice()
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, limit);
    },

    async acceptHandover(handoverId: string): Promise<void> {
      const h = handovers.find((x) => x.id === handoverId);
      if (h) h.verifiedByDoctor = true;
      audit.unshift({
        id: `aud_${audit.length + 1}`,
        actorId: DOCTOR.id,
        actorName: DOCTOR.fullName,
        action: "Accepted ARIA handover",
        target: handoverId,
        at: new Date().toISOString(),
      });
    },

    async saveEncounter(input: SaveEncounterInput): Promise<Encounter> {
      const now = new Date();
      const encounter: Encounter = {
        id: `enc_${now.getTime()}`,
        patientId: input.patientId,
        doctorId: DOCTOR.id,
        startedAt: now.toISOString(),
        endedAt: now.toISOString(),
        channel: input.channel,
        chiefComplaint: input.chiefComplaint,
        assessment: input.assessment,
        clinicalNotes: input.clinicalNotes,
        prescriptions: input.prescriptions,
        labRequests: input.labRequests,
        followUp: input.followUp,
        ariaAccepted: input.ariaAccepted,
      };
      encounters.unshift(encounter);
      queue = queue.map((q) =>
        q.id === input.queueId ? { ...q, state: "completed" } : q
      );
      audit.unshift({
        id: `aud_${audit.length + 1}`,
        actorId: DOCTOR.id,
        actorName: DOCTOR.fullName,
        action: "Filed encounter note",
        target: input.patientId,
        reason: input.chiefComplaint,
        at: now.toISOString(),
      });
      return encounter;
    },
  };
}
