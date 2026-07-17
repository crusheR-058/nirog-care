"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OnboardingProfile } from "@/lib/domain/types";

export type SaveResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  displayName: z.string().min(1),
  specialty: z.string().min(1, "Choose your specialty"),
  education: z.string().min(1, "Add your qualifications"),
  registrationNo: z.string().min(2, "Add your registration number"),
  country: z.string().min(1),
});

/**
 * Persist the onboarding profile and unlock the portal. Runs server-side and
 * updates the current doctor's row via the service role (after verifying the
 * session), so it doesn't need a Doctor UPDATE RLS policy.
 */
export async function saveOnboarding(
  profile: OnboardingProfile
): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session expired. Please sign in again." };

  const parsed = schema.safeParse(profile);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please complete the required fields." };
  }

  const display = /^dr\.?\s/i.test(profile.displayName)
    ? profile.displayName
    : `Dr. ${profile.displayName}`;

  const admin = createAdminClient();
  const { error } = await admin
    .from("Doctor")
    .update({
      fullName: display,
      specialty: profile.specialty,
      registrationNo: profile.registrationNo,
      languages: profile.languages,
      clinicName: profile.clinicName || "Independent practice",
      country: profile.country,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile: profile as any,
      onboardingComplete: true,
    })
    .eq("authUserId", user.id);

  if (error) {
    return {
      ok: false,
      error: /registrationNo/i.test(error.message)
        ? "That registration number is already registered to another account."
        : "Could not save your profile. Please try again.",
    };
  }

  // Log it to the trust trail.
  const { data: doc } = await admin
    .from("Doctor")
    .select("id")
    .eq("authUserId", user.id)
    .maybeSingle();
  if (doc) {
    await admin.from("AuditEvent").insert({
      id: crypto.randomUUID(),
      actorId: doc.id,
      actorName: display,
      action: "Completed onboarding",
      target: "Verification",
      reason: `${profile.country} · ${profile.specialty}`,
      at: new Date().toISOString(),
    });
  }

  return { ok: true };
}
