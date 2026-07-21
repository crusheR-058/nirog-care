import { createAdminClient } from "@/lib/supabase/admin";

export type AccountRole = "doctor" | "pharmacy" | "unknown";

/**
 * Doctors and pharmacies share one Supabase Auth pool, so the sign-in form a
 * person happens to use says nothing about which kind of account they hold.
 * Resolve the real role and send them where they belong — a pharmacy that signs
 * in on the clinician form should still land in its own console, not bounce
 * through /portal.
 *
 * Uses the service role deliberately: this runs before any RLS-scoped session
 * work, purely to answer "which product is this account for?".
 */
export async function resolveRole(authUserId: string): Promise<AccountRole> {
  const admin = createAdminClient();

  const [doctor, pharmacy] = await Promise.all([
    admin.from("Doctor").select("id").eq("authUserId", authUserId).maybeSingle(),
    admin
      .from("Pharmacy")
      .select("id,onboardingComplete,verified")
      .eq("authUserId", authUserId)
      .maybeSingle(),
  ]);

  if (pharmacy.data) return "pharmacy";
  if (doctor.data) return "doctor";
  return "unknown";
}

/**
 * The post-sign-in destination for an account, resolved from its actual role
 * rather than from which form was used.
 */
export async function destinationFor(authUserId: string): Promise<string> {
  const admin = createAdminClient();

  const { data: pharmacy } = await admin
    .from("Pharmacy")
    .select("onboardingComplete,verified")
    .eq("authUserId", authUserId)
    .maybeSingle();

  if (pharmacy) {
    if (!pharmacy.onboardingComplete) return "/pharmacy/onboarding";
    return pharmacy.verified ? "/pharmacy/dashboard" : "/pharmacy/status";
  }

  // Doctors (and anyone unrecognised) go to the portal, whose layout runs the
  // remaining gates — MFA step-up and onboarding.
  return "/portal";
}
