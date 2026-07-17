/**
 * Nirog clinical domain model.
 *
 * These types are the single contract shared by the mock data source and the
 * real Prisma-backed source. The pitch's "trust architecture" is encoded here:
 * an account is not a patient, care relationships are explicit and scoped,
 * consent gates records, and every read/write is auditable.
 */

export type Sex = "male" | "female" | "other";

export type TriageLevel = "emergency" | "urgent" | "routine";

export type QueueState =
  | "waiting"
  | "in_consult"
  | "completed"
  | "no_show"
  | "scheduled";

export type EncounterKind =
  | "new"
  | "follow_up"
  | "pediatrics"
  | "chronic"
  | "emergency";

export type ConsultChannel = "video" | "audio" | "chat";

export type RelationshipRole =
  | "self"
  | "child"
  | "parent"
  | "spouse"
  | "dependent";

/** A verified clinician using the doctor portal. */
export interface Doctor {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  registrationNo: string; // HPR / medical council id
  languages: string[];
  clinicName: string;
  mfaEnabled: boolean;
  avatarTone?: string;
}

/** A patient profile — may be the account holder or a managed dependent. */
export interface Patient {
  id: string;
  fullName: string;
  sex: Sex;
  dateOfBirth: string; // ISO date
  phoneMasked: string; // never expose full PII in the UI
  village: string;
  district: string;
  preferredLanguage: string;
  abhaLinked: boolean;
  relationshipToAccount: RelationshipRole;
  allergies: string[];
  conditions: string[];
  currentMedications: string[];
  avatarTone?: string;
}

/** ARIA (AI intake) hands a structured, UNVERIFIED summary to the doctor. */
export interface AriaHandover {
  id: string;
  patientId: string;
  createdAt: string;
  chiefComplaint: string;
  narrative: string;
  durationText: string;
  symptoms: string[];
  redFlags: string[]; // deterministic escalation signals
  vitals?: Vitals;
  aiConfidence: number; // 0..1
  suggestedTriage: TriageLevel;
  language: string;
  verifiedByDoctor: boolean;
}

export interface Vitals {
  tempC?: number;
  pulseBpm?: number;
  spo2?: number;
  systolic?: number;
  diastolic?: number;
  respRate?: number;
}

/** A position in a doctor's live queue for the day. */
export interface QueueEntry {
  id: string;
  patientId: string;
  doctorId: string;
  kind: EncounterKind;
  triage: TriageLevel;
  state: QueueState;
  checkedInAt: string; // used for the waiting clock
  scheduledFor: string;
  channel: ConsultChannel;
  reason: string;
  handoverId?: string;
  connectionQuality: "good" | "fair" | "poor";
}

export interface Prescription {
  id: string;
  drug: string;
  strength: string;
  form: string;
  dose: string;
  frequency: string;
  durationDays: number;
  notes?: string;
}

export interface LabRequest {
  id: string;
  test: string;
  priority: "routine" | "urgent";
  reason?: string;
}

export interface FollowUp {
  inDays: number;
  channel: ConsultChannel;
  instructions: string;
}

/** A completed or in-progress clinical encounter (the care plan). */
export interface Encounter {
  id: string;
  patientId: string;
  doctorId: string;
  startedAt: string;
  endedAt?: string;
  channel: ConsultChannel;
  chiefComplaint: string;
  assessment: string;
  clinicalNotes: string;
  prescriptions: Prescription[];
  labRequests: LabRequest[];
  followUp?: FollowUp;
  ariaAccepted: boolean; // did the doctor accept/edit ARIA's summary?
}

/** Purpose-specific, revocable consent — gates access to records. */
export interface ConsentGrant {
  id: string;
  patientId: string;
  grantedTo: string; // doctor or facility id
  purpose: string;
  scope: string[];
  grantedAt: string;
  expiresAt: string;
  active: boolean;
}

/** Immutable audit event: who / what / why. */
export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  target: string;
  reason?: string;
  at: string;
}

/** Aggregate the chart view needs — assembled by the data source. */
export interface PatientChart {
  patient: Patient;
  handover?: AriaHandover;
  history: Encounter[];
  consent?: ConsentGrant;
}

export interface DashboardStats {
  waiting: number;
  scheduledToday: number;
  completedToday: number;
  avgWaitMin: number;
  emergencies: number;
}
