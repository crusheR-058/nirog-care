import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/brand/logo";
import { PharmacyWizard } from "@/components/pharmacy/wizard";

export const metadata: Metadata = { title: "Verify your pharmacy" };
export const dynamic = "force-dynamic";

export default async function PharmacyOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Read via the service role: the pharmacy's own RLS would also allow this,
  // but this keeps the page working before any policy is evaluated client-side.
  const admin = createAdminClient();
  const { data: pharmacy } = await admin
    .from("Pharmacy")
    .select("id,name,ownerName,email,licenseNo,country,onboardingComplete")
    .eq("authUserId", user.id)
    .maybeSingle();

  // Signed in but not a pharmacy account → send them to their own flow.
  if (!pharmacy) redirect("/portal");
  if (pharmacy.onboardingComplete) redirect("/pharmacy/status");

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
        <p className="inline-flex rounded-full bg-soft-green px-3.5 py-1.5 text-xs font-semibold text-green">
          One-time verification
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Verify your pharmacy
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-ink-soft">
          Nirog verifies every partner pharmacy before routing a prescription.
          Tell us about your premises and upload your licence — it takes a few
          minutes.
        </p>
      </div>

      <PharmacyWizard
        pharmacyId={pharmacy.id}
        email={pharmacy.email}
        defaults={{
          name: pharmacy.name,
          ownerName: pharmacy.ownerName,
          licenseNo: pharmacy.licenseNo,
          country: pharmacy.country ?? undefined,
        }}
      />
    </div>
  );
}
