/**
 * The Nirog data-source contract.
 *
 * The portal never talks to a database or mock arrays directly — it calls this
 * interface. Two implementations satisfy it: an in-memory mock (default) and a
 * Prisma/Postgres source (NIROG_DATA_SOURCE=db). This is the "one shared
 * authenticated API" seam from the pitch: swap the backend without touching UI.
 */
import type {
  AuditEvent,
  DashboardStats,
  Doctor,
  Encounter,
  PatientChart,
  QueueEntry,
} from "@/lib/domain/types";

export interface QueueItemView extends QueueEntry {
  patientName: string;
  patientAge: number;
  patientAvatarTone?: string;
  redFlagCount: number;
  waitingMinutes: number;
}

export interface PatientListItem {
  id: string;
  fullName: string;
  age: number;
  sex: string;
  village: string;
  district: string;
  conditions: string[];
  avatarTone?: string;
  abhaLinked: boolean;
  consentActive: boolean;
  inQueue: boolean;
}

export interface NirogDataSource {
  getDoctor(): Promise<Doctor>;
  getDashboardStats(): Promise<DashboardStats>;
  getQueue(): Promise<QueueItemView[]>;
  getQueueItem(id: string): Promise<QueueItemView | null>;
  getPatients(): Promise<PatientListItem[]>;
  getPatientChart(patientId: string): Promise<PatientChart | null>;
  getRecentAudit(limit?: number): Promise<AuditEvent[]>;
  /** Persist a finished encounter and mark ARIA reviewed. */
  saveEncounter(input: SaveEncounterInput): Promise<Encounter>;
  acceptHandover(handoverId: string): Promise<void>;
}

export interface SaveEncounterInput {
  patientId: string;
  queueId: string;
  chiefComplaint: string;
  assessment: string;
  clinicalNotes: string;
  channel: Encounter["channel"];
  prescriptions: Encounter["prescriptions"];
  labRequests: Encounter["labRequests"];
  followUp?: Encounter["followUp"];
  ariaAccepted: boolean;
}

// Cache on globalThis so the SAME instance (and, for the mock source, its
// mutable in-memory state) is shared across RSC renders and server actions —
// Next/Turbopack can otherwise hand them separate module scopes in dev.
const globalForData = globalThis as unknown as {
  nirogDataSource?: NirogDataSource;
};

/**
 * Resolve the active data source.
 * - `supabase`: per-REQUEST, authenticated (RLS-enforced) — never cached, since
 *   it's bound to the current doctor's session.
 * - `db`: Prisma/Postgres (service role), cached per process.
 * - `mock` (default): in-memory, cached per process.
 */
export async function getDataSource(): Promise<NirogDataSource> {
  const mode = process.env.NIROG_DATA_SOURCE ?? "mock";

  if (mode === "supabase") {
    const [{ createSupabaseDataSource }, { createClient }] = await Promise.all([
      import("@/lib/data/supabase-source"),
      import("@/lib/supabase/server"),
    ]);
    return createSupabaseDataSource(await createClient());
  }

  if (globalForData.nirogDataSource) return globalForData.nirogDataSource;
  if (mode === "db") {
    const { createPrismaDataSource } = await import("@/lib/data/prisma-source");
    globalForData.nirogDataSource = createPrismaDataSource();
  } else {
    const { createMockDataSource } = await import("@/lib/data/mock-source");
    globalForData.nirogDataSource = createMockDataSource();
  }
  return globalForData.nirogDataSource;
}
