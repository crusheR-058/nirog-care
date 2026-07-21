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
  onboardingComplete: boolean;
  country?: string;
  /** On-demand availability — when true the doctor is in the matching pool. */
  onCall?: boolean;
}

/** Full onboarding/verification payload (stored as JSON on the Doctor row). */
export interface OnboardingProfile {
  // Identity
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName: string;
  gender: "male" | "female" | "other";
  dateOfBirth?: string;
  mobile: string;
  altMobile?: string;
  altMobile2?: string;
  languages: string[];
  profilePhotoPath?: string;

  // Country + identity documents (country-aware)
  country: string;
  taxIdLabel?: string; // "PAN", "SSN", "NINO"…
  taxId?: string;
  taxIdDocPath?: string;
  idProofType?: string; // "Aadhaar", "Passport", "Driver's license"…
  idProofFrontPath?: string;
  idProofBackPath?: string;

  // Practice / location
  clinicName: string;
  clinicStreet?: string;
  clinicAddress?: string;
  clinicCity?: string;
  clinicState?: string;
  clinicPincode?: string;

  // Qualifications
  education: string; // "MBBS, MD, DM"
  certificates: Partial<Record<CertKey, string>>; // storage paths
  yearsExperience: number;
  specialty: string;
  awards?: string;

  // Registration / license (country-aware)
  councilLabel?: string; // "SMC/DMC/RCI/IDA/IAP", "GMC", "State Medical Board"…
  registrationNo: string;
  registrationDocPath?: string;

  // Consultation
  consultType: "online" | "physical" | "both";
  weekdays: string[];
  slots: { day: string; from: string; to: string }[];
  currency: string;
  onlineFee?: number;
  physicalFee?: number;

  // Payout (country-aware)
  bankAccountName?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankRoutingLabel?: string; // "IFSC", "SWIFT/BIC", "Routing"…
  bankRouting?: string;
  bankIban?: string;
  cancelledChequePath?: string;

  // Extras
  secretaryName?: string;
  secretaryNumber?: string;
  membership?: string;
  conditionsTreated?: string;
  servicesOffered?: string;
  researchLinks?: string;
}

export type CertKey =
  | "undergraduate"
  | "postgraduate"
  | "diploma"
  | "dnb"
  | "superSpecialty"
  | "fellowship";

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
  /** Null while the request sits in the on-demand pool (unclaimed). */
  doctorId?: string;
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

/** One medication line on a care plan. */
export interface Prescription {
  id: string;
  drug: string;
  strength: string;
  form: string;
  dose: string;
  frequency: string;
  durationDays: number;
  notes?: string;
  /** WHO ATC code when the line was picked from the catalogue (not free text). */
  atcCode?: string;
  drugId?: string;
  quantity?: number;
  /** May the pharmacy dispense an equivalent generic? */
  substitutionAllowed?: boolean;
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

// ─── Fulfilment ──────────────────────────────────────────────────────────────

/** A WHO ATC catalogue entry — the global classification of drug substances. */
export interface Drug {
  id: string;
  atcCode: string;
  name: string;
  anatomicalCode: string;
  anatomicalName: string;
  therapeuticCode: string;
  therapeuticName: string;
  pharmacologicalCode: string;
  pharmacologicalName: string;
  chemicalCode: string;
  chemicalName: string;
  /** WHO Defined Daily Dose — the assumed average maintenance dose. */
  ddd?: number;
  dddUom?: string;
  route?: string;
}

export type OrderStatus =
  | "routed"
  | "accepted"
  | "preparing"
  | "ready"
  | "dispatched"
  | "delivered"
  | "rejected"
  | "cancelled";

export type DeliveryMode = "pickup" | "delivery";

export interface PrescriptionItem {
  id: string;
  drugId?: string;
  drugName: string;
  atcCode?: string;
  strength?: string;
  form?: string;
  dose?: string;
  frequency?: string;
  durationDays?: number;
  quantity?: number;
  instructions?: string;
  substitutionAllowed: boolean;
}

export interface OrderEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  actor: string;
  at: string;
}

/**
 * One dispensing job as a pharmacy sees it.
 *
 * Note what is NOT here: no diagnosis, no clinical notes, no patient id. The
 * delivery details are snapshotted onto the order so fulfilment never needs a
 * join into the clinical record.
 */
export interface PharmacyOrderView {
  id: string;
  prescriptionId: string;
  pharmacyId?: string;
  status: OrderStatus;
  deliveryMode: DeliveryMode;
  district?: string;
  state?: string;
  country?: string;
  patientName: string;
  patientPhone?: string;
  patientVillage?: string;
  patientDistrict?: string;
  routedAt: string;
  acceptedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  rejectionReason?: string;
  totalAmount?: number;
  /** Prescriber attribution, snapshotted at issue. */
  doctorName: string;
  doctorRegNo: string;
  issuedAt: string;
  notes?: string;
  items: PrescriptionItem[];
  events?: OrderEvent[];
  /** Minutes since the order was routed — the pharmacy's SLA clock. */
  waitingMinutes: number;
}

/** Rollup for the pharmacy command centre. */
export interface PharmacyStats {
  incoming: number;
  active: number;
  dispatched: number;
  deliveredToday: number;
  avgAcceptMin: number;
  lines30d: number;
}
