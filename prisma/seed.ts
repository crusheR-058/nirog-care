/**
 * Seed the Postgres backend from the same fixtures the mock source uses,
 * so the "db" mode is a faithful mirror of the demo. Idempotent-ish: it clears
 * clinical tables first, then reinserts.
 */
import { PrismaClient, Prisma } from "../src/generated/prisma";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// Domain interfaces are structural and lack index signatures, so cast when
// handing them to Prisma's Json input columns.
const json = (v: unknown): Prisma.InputJsonValue =>
  v as Prisma.InputJsonValue;
import {
  CONSENTS,
  DOCTOR,
  HANDOVERS,
  PAST_ENCOUNTERS,
  PATIENTS,
  buildQueue,
} from "../src/lib/data/seed";
import {
  DEMO_DOCTOR_EMAIL,
  DEMO_DOCTOR_PASSWORD,
} from "../src/lib/data/constants";

const prisma = new PrismaClient();

/**
 * Idempotently create the demo doctor as a Supabase Auth user and return its
 * uuid. Re-runs reuse the existing user (createUser errors → look it up).
 */
async function ensureAuthUser(): Promise<string> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const email = process.env.DEMO_DOCTOR_EMAIL ?? "ananya.rao@nirog.health";
  const password = process.env.DEMO_DOCTOR_PASSWORD ?? "nirog-demo";

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Dr. Ananya Rao" },
  });
  if (created.data.user) return created.data.user.id;

  // Already exists — find it (also reset the password so the demo login works).
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = data.users.find((u) => u.email === email);
  if (!existing) throw new Error(`Could not create or find auth user: ${created.error?.message}`);
  await admin.auth.admin.updateUserById(existing.id, { password });
  return existing.id;
}

async function main() {
  console.log("Clearing existing data…");
  await prisma.auditEvent.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.consentGrant.deleteMany();
  await prisma.ariaHandover.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.account.deleteMany();
  await prisma.doctor.deleteMany();

  console.log("Ensuring Supabase Auth user for the demo doctor…");
  const authUserId = await ensureAuthUser();

  console.log("Seeding doctor…");
  const passwordHash = await bcrypt.hash(DEMO_DOCTOR_PASSWORD, 10);
  const doctor = await prisma.doctor.create({
    data: {
      id: DOCTOR.id,
      authUserId,
      fullName: DOCTOR.fullName,
      email: DEMO_DOCTOR_EMAIL,
      passwordHash,
      specialty: DOCTOR.specialty,
      registrationNo: DOCTOR.registrationNo,
      languages: DOCTOR.languages,
      clinicName: DOCTOR.clinicName,
      mfaEnabled: DOCTOR.mfaEnabled,
      avatarTone: DOCTOR.avatarTone,
      onboardingComplete: true,
      country: "India",
    },
  });

  console.log("Seeding accounts + patients…");
  // One account per unique masked phone; dependents share their account.
  const accountByPhone = new Map<string, string>();
  for (const p of PATIENTS) {
    let accountId = accountByPhone.get(p.phoneMasked);
    if (!accountId) {
      const account = await prisma.account.create({
        data: { phone: `${p.phoneMasked}-${accountByPhone.size}` },
      });
      accountId = account.id;
      accountByPhone.set(p.phoneMasked, accountId);
    }
    await prisma.patient.create({
      data: {
        id: p.id,
        accountId,
        fullName: p.fullName,
        sex: p.sex,
        dateOfBirth: new Date(p.dateOfBirth),
        phoneMasked: p.phoneMasked,
        village: p.village,
        district: p.district,
        preferredLanguage: p.preferredLanguage,
        abhaLinked: p.abhaLinked,
        relationshipToAccount: p.relationshipToAccount,
        allergies: p.allergies,
        conditions: p.conditions,
        currentMedications: p.currentMedications,
        avatarTone: p.avatarTone,
      },
    });
  }

  console.log("Seeding ARIA handovers…");
  for (const h of HANDOVERS) {
    await prisma.ariaHandover.create({
      data: {
        id: h.id,
        patientId: h.patientId,
        createdAt: new Date(h.createdAt),
        chiefComplaint: h.chiefComplaint,
        narrative: h.narrative,
        durationText: h.durationText,
        symptoms: h.symptoms,
        redFlags: h.redFlags,
        vitals: h.vitals ? json(h.vitals) : undefined,
        aiConfidence: h.aiConfidence,
        suggestedTriage: h.suggestedTriage,
        language: h.language,
        verifiedByDoctor: h.verifiedByDoctor,
      },
    });
  }

  console.log("Seeding consent grants…");
  for (const c of CONSENTS) {
    await prisma.consentGrant.create({
      data: {
        id: c.id,
        patientId: c.patientId,
        grantedTo: doctor.id,
        purpose: c.purpose,
        scope: c.scope,
        grantedAt: new Date(c.grantedAt),
        expiresAt: new Date(c.expiresAt),
        active: c.active,
      },
    });
  }

  console.log("Seeding today's queue…");
  for (const q of buildQueue(new Date())) {
    await prisma.queueEntry.create({
      data: {
        id: q.id,
        patientId: q.patientId,
        doctorId: doctor.id,
        kind: q.kind,
        triage: q.triage,
        state: q.state,
        checkedInAt: new Date(q.checkedInAt),
        scheduledFor: new Date(q.scheduledFor),
        channel: q.channel,
        reason: q.reason,
        connectionQuality: q.connectionQuality,
        handoverId: q.handoverId ?? null,
      },
    });
  }

  console.log("Seeding past encounters…");
  for (const e of PAST_ENCOUNTERS) {
    await prisma.encounter.create({
      data: {
        id: e.id,
        patientId: e.patientId,
        doctorId: doctor.id,
        startedAt: new Date(e.startedAt),
        endedAt: e.endedAt ? new Date(e.endedAt) : null,
        channel: e.channel,
        chiefComplaint: e.chiefComplaint,
        assessment: e.assessment,
        clinicalNotes: e.clinicalNotes,
        prescriptions: json(e.prescriptions),
        labRequests: json(e.labRequests),
        followUp: e.followUp ? json(e.followUp) : undefined,
        ariaAccepted: e.ariaAccepted,
      },
    });
  }

  console.log("✓ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
