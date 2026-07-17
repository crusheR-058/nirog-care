import type { Metadata } from "next";
import { getDataSource } from "@/lib/data/source";
import { PatientsList } from "./patients-list";

export const metadata: Metadata = { title: "Patients" };
export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const ds = await getDataSource();
  const patients = await ds.getPatients();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Patients
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Only patients who have granted you a care relationship appear here —
          there is no clinic-wide patient search.
        </p>
      </header>
      <PatientsList patients={patients} />
    </div>
  );
}
