/**
 * Prisma/Postgres implementation of NirogDataSource.
 *
 * Enabled with NIROG_DATA_SOURCE=db. Maps database rows to the shared domain
 * contract so the portal UI is identical regardless of backend. Assumes the
 * single seeded demo doctor for session context.
 */
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import type {
  AriaHandover,
  AuditEvent,
  DashboardStats,
  Doctor,
  Encounter,
  Patient,
  PatientChart,
  TriageLevel,
  Vitals,
} from "@/lib/domain/types";
import type {
  NirogDataSource,
  PatientListItem,
  QueueItemView,
  SaveEncounterInput,
} from "@/lib/data/source";
import { minutesSince } from "@/lib/utils";
import { DEMO_DOCTOR_EMAIL } from "@/lib/data/constants";

type DbDoctor = Awaited<ReturnType<typeof prisma.doctor.findFirst>>;
type DbPatient = Awaited<ReturnType<typeof prisma.patient.findFirst>>;
type DbHandover = Awaited<ReturnType<typeof prisma.ariaHandover.findFirst>>;

function ageFromDob(dob: Date, now: Date): number {
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function mapDoctor(d: NonNullable<DbDoctor>): Doctor {
  return {
    id: d.id,
    fullName: d.fullName,
    email: d.email,
    specialty: d.specialty,
    registrationNo: d.registrationNo,
    languages: d.languages,
    clinicName: d.clinicName,
    mfaEnabled: d.mfaEnabled,
    avatarTone: d.avatarTone ?? undefined,
    onboardingComplete: d.onboardingComplete ?? false,
    country: d.country ?? undefined,
  };
}

function mapPatient(p: NonNullable<DbPatient>): Patient {
  return {
    id: p.id,
    fullName: p.fullName,
    sex: p.sex,
    dateOfBirth: p.dateOfBirth.toISOString(),
    phoneMasked: p.phoneMasked,
    village: p.village,
    district: p.district,
    preferredLanguage: p.preferredLanguage,
    abhaLinked: p.abhaLinked,
    relationshipToAccount: p.relationshipToAccount,
    allergies: p.allergies,
    conditions: p.conditions,
    currentMedications: p.currentMedications,
    avatarTone: p.avatarTone ?? undefined,
  };
}

function mapHandover(h: NonNullable<DbHandover>): AriaHandover {
  return {
    id: h.id,
    patientId: h.patientId,
    createdAt: h.createdAt.toISOString(),
    chiefComplaint: h.chiefComplaint,
    narrative: h.narrative,
    durationText: h.durationText,
    symptoms: h.symptoms,
    redFlags: h.redFlags,
    vitals: (h.vitals as unknown as Vitals | null) ?? undefined,
    aiConfidence: h.aiConfidence,
    suggestedTriage: h.suggestedTriage as TriageLevel,
    language: h.language,
    verifiedByDoctor: h.verifiedByDoctor,
  };
}

async function currentDoctor() {
  const doctor = await prisma.doctor.findUnique({
    where: { email: DEMO_DOCTOR_EMAIL },
  });
  if (!doctor) throw new Error("Seeded doctor not found. Run: pnpm db:seed");
  return doctor;
}

export function createPrismaDataSource(): NirogDataSource {
  return {
    async getDoctor(): Promise<Doctor> {
      return mapDoctor(await currentDoctor());
    },

    async getQueue(): Promise<QueueItemView[]> {
      const doctor = await currentDoctor();
      const now = new Date();
      const rows = await prisma.queueEntry.findMany({
        where: { doctorId: doctor.id },
        include: { patient: true, handover: true },
      });
      const rank = { emergency: 0, urgent: 1, routine: 2 } as const;
      const stateRank: Record<string, number> = {
        waiting: 0,
        in_consult: 0,
        scheduled: 1,
        completed: 2,
        no_show: 3,
      };
      return rows
        .map((q) => ({
          id: q.id,
          patientId: q.patientId,
          doctorId: q.doctorId,
          kind: q.kind,
          triage: q.triage,
          state: q.state,
          checkedInAt: q.checkedInAt.toISOString(),
          scheduledFor: q.scheduledFor.toISOString(),
          channel: q.channel,
          reason: q.reason,
          handoverId: q.handoverId ?? undefined,
          connectionQuality:
            q.connectionQuality as QueueItemView["connectionQuality"],
          patientName: q.patient.fullName,
          patientAge: ageFromDob(q.patient.dateOfBirth, now),
          patientAvatarTone: q.patient.avatarTone ?? undefined,
          redFlagCount: q.handover?.redFlags.length ?? 0,
          waitingMinutes:
            q.state === "waiting"
              ? minutesSince(q.checkedInAt.toISOString(), now)
              : 0,
        }))
        .sort(
          (a, b) =>
            stateRank[a.state] - stateRank[b.state] ||
            rank[a.triage] - rank[b.triage] ||
            new Date(a.checkedInAt).getTime() -
              new Date(b.checkedInAt).getTime()
        );
    },

    async getQueueItem(id: string): Promise<QueueItemView | null> {
      const all = await this.getQueue();
      return all.find((q) => q.id === id) ?? null;
    },

    async getPatients(): Promise<PatientListItem[]> {
      const now = new Date();
      const [patients, activeQueue, consents] = await Promise.all([
        prisma.patient.findMany({ orderBy: { fullName: "asc" } }),
        prisma.queueEntry.findMany({
          where: { state: { in: ["waiting", "scheduled"] } },
          select: { patientId: true },
        }),
        prisma.consentGrant.findMany({ where: { active: true } }),
      ]);
      const inQueue = new Set(activeQueue.map((q) => q.patientId));
      const consented = new Set(consents.map((c) => c.patientId));
      return patients.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        age: ageFromDob(p.dateOfBirth, now),
        sex: p.sex,
        village: p.village,
        district: p.district,
        conditions: p.conditions,
        avatarTone: p.avatarTone ?? undefined,
        abhaLinked: p.abhaLinked,
        consentActive: consented.has(p.id),
        inQueue: inQueue.has(p.id),
      }));
    },

    async getDashboardStats(): Promise<DashboardStats> {
      const view = await this.getQueue();
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

    async getPatientChart(patientId: string): Promise<PatientChart | null> {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });
      if (!patient) return null;
      const [handover, encounters, consent] = await Promise.all([
        prisma.ariaHandover.findFirst({
          where: { patientId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.encounter.findMany({
          where: { patientId },
          orderBy: { startedAt: "desc" },
        }),
        prisma.consentGrant.findFirst({ where: { patientId } }),
      ]);
      return {
        patient: mapPatient(patient),
        handover: handover ? mapHandover(handover) : undefined,
        history: encounters.map((e) => ({
          id: e.id,
          patientId: e.patientId,
          doctorId: e.doctorId,
          startedAt: e.startedAt.toISOString(),
          endedAt: e.endedAt?.toISOString(),
          channel: e.channel,
          chiefComplaint: e.chiefComplaint,
          assessment: e.assessment,
          clinicalNotes: e.clinicalNotes,
          prescriptions: e.prescriptions as unknown as Encounter["prescriptions"],
          labRequests: e.labRequests as unknown as Encounter["labRequests"],
          followUp: (e.followUp as unknown as Encounter["followUp"]) ?? undefined,
          ariaAccepted: e.ariaAccepted,
        })),
        consent: consent
          ? {
              id: consent.id,
              patientId: consent.patientId,
              grantedTo: consent.grantedTo,
              purpose: consent.purpose,
              scope: consent.scope,
              grantedAt: consent.grantedAt.toISOString(),
              expiresAt: consent.expiresAt.toISOString(),
              active: consent.active,
            }
          : undefined,
      };
    },

    async getRecentAudit(limit = 8): Promise<AuditEvent[]> {
      const rows = await prisma.auditEvent.findMany({
        orderBy: { at: "desc" },
        take: limit,
      });
      return rows.map((a) => ({
        id: a.id,
        actorId: a.actorId ?? "",
        actorName: a.actorName,
        action: a.action,
        target: a.target,
        reason: a.reason ?? undefined,
        at: a.at.toISOString(),
      }));
    },

    async acceptHandover(handoverId: string): Promise<void> {
      const doctor = await currentDoctor();
      await prisma.ariaHandover.update({
        where: { id: handoverId },
        data: { verifiedByDoctor: true },
      });
      await prisma.auditEvent.create({
        data: {
          actorId: doctor.id,
          actorName: doctor.fullName,
          action: "Accepted ARIA handover",
          target: handoverId,
        },
      });
    },

    async saveEncounter(input: SaveEncounterInput): Promise<Encounter> {
      const doctor = await currentDoctor();
      const now = new Date();
      const created = await prisma.encounter.create({
        data: {
          patientId: input.patientId,
          doctorId: doctor.id,
          startedAt: now,
          endedAt: now,
          channel: input.channel,
          chiefComplaint: input.chiefComplaint,
          assessment: input.assessment,
          clinicalNotes: input.clinicalNotes,
          prescriptions: input.prescriptions as unknown as Prisma.InputJsonValue,
          labRequests: input.labRequests as unknown as Prisma.InputJsonValue,
          followUp: input.followUp
            ? (input.followUp as unknown as Prisma.InputJsonValue)
            : undefined,
          ariaAccepted: input.ariaAccepted,
        },
      });
      await prisma.queueEntry.update({
        where: { id: input.queueId },
        data: { state: "completed" },
      });
      await prisma.auditEvent.create({
        data: {
          actorId: doctor.id,
          actorName: doctor.fullName,
          action: "Filed encounter note",
          target: input.patientId,
          reason: input.chiefComplaint,
        },
      });
      return {
        id: created.id,
        patientId: created.patientId,
        doctorId: created.doctorId,
        startedAt: created.startedAt.toISOString(),
        endedAt: created.endedAt?.toISOString(),
        channel: created.channel,
        chiefComplaint: created.chiefComplaint,
        assessment: created.assessment,
        clinicalNotes: created.clinicalNotes,
        prescriptions: created.prescriptions as unknown as Encounter["prescriptions"],
        labRequests: created.labRequests as unknown as Encounter["labRequests"],
        followUp: (created.followUp as unknown as Encounter["followUp"]) ?? undefined,
        ariaAccepted: created.ariaAccepted,
      };
    },
  };
}
