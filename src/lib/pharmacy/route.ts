import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Doctors and pharmacies share one Supabase Auth pool, so a pharmacy signing in
 * lands on /portal by default — where it has no clinician profile. This returns
 * the pharmacy's own destination when the current user is a pharmacy, and null
 * otherwise (the common case, so it stays a single indexed lookup).
 */
export async function pharmacyRedirectFor(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("Pharmacy")
    .select("onboardingComplete")
    .eq("authUserId", user.id)
    .maybeSingle();

  if (!data) return null;
  return data.onboardingComplete ? "/pharmacy/status" : "/pharmacy/onboarding";
}
