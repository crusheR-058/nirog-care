import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDataSource } from "@/lib/data/source";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/brand/logo";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata: Metadata = { title: "Complete your profile" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ds = await getDataSource();
  const doctor = await ds.getDoctor();
  if (doctor.onboardingComplete) redirect("/portal");

  // Pre-fill from whatever we already know (email signup / Google metadata).
  const nameParts = doctor.fullName.replace(/^Dr\.?\s*/i, "").split(/\s+/);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex items-center justify-between border-b border-hairline bg-panel/70 px-5 py-3.5 backdrop-blur">
        <Logo size={26} />
        <form action={logout}>
          <button type="submit" className="text-sm font-medium text-ink-soft hover:text-ink">
            Sign out
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-3xl px-5 pt-8 text-center">
        <p className="inline-flex rounded-full bg-soft-blue px-3.5 py-1.5 text-xs font-semibold text-blue">
          One-time setup
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Complete your clinician profile
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-ink-soft">
          Nirog verifies every doctor before they see a patient. Tell us about
          your practice and upload your credentials — it takes a few minutes.
        </p>
      </div>

      <OnboardingWizard
        doctorId={doctor.id}
        email={doctor.email}
        defaults={{
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" "),
          displayName: doctor.fullName,
          specialty: doctor.specialty,
          registrationNo: doctor.registrationNo,
          languages: doctor.languages,
          clinicName: doctor.clinicName,
          country: doctor.country,
        }}
      />
    </div>
  );
}
