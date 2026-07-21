"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PharmacyProfile } from "@/lib/pharmacy/config";

export type PharmacySignUpState = { error?: string };
export type SaveResult = { ok: true } | { ok: false; error: string };

const signupSchema = z.object({
  name: z.string().min(2, "Enter your pharmacy name"),
  ownerName: z.string().min(2, "Enter the owner's name"),
  email: z.string().email("Enter a valid business email"),
  password: z.string().min(8, "Use at least 8 characters"),
  licenseNo: z.string().min(3, "Enter your drug licence number"),
});

/**
 * Register a partner pharmacy. Mirrors registerDoctor: the account is created
 * confirmed via the admin client and a Pharmacy profile is linked to it, then
 * the pharmacy is signed in and sent to the verification wizard. Dispensing
 * access stays closed until Nirog approves the licence (Pharmacy.verified).
 */
export async function registerPharmacy(
  _prev: PharmacySignUpState,
  formData: FormData
): Promise<PharmacySignUpState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    password: formData.get("password"),
    licenseNo: formData.get("licenseNo"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const { name, ownerName, email, password, licenseNo } = parsed.data;
  const admin = createAdminClient();

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role: "pharmacy" },
  });
  if (created.error || !created.data.user) {
    const msg = created.error?.message ?? "";
    return {
      error: /already|registered|exists/i.test(msg)
        ? "An account with this email already exists."
        : "Could not create the account. Please try again.",
    };
  }

  const pharmacyId = crypto.randomUUID();
  const profile = await admin.from("Pharmacy").insert({
    id: pharmacyId,
    authUserId: created.data.user.id,
    name,
    email,
    licenseNo,
    ownerName,
    services: [],
    avatarTone: "green",
    createdAt: new Date().toISOString(),
  });
  if (profile.error) {
    // Avoid an orphaned auth user if the profile insert fails.
    await admin.auth.admin.deleteUser(created.data.user.id);
    return {
      error: /licenseNo/i.test(profile.error.message)
        ? "That drug licence number is already registered."
        : "Could not create your pharmacy profile.",
    };
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });
  revalidatePath("/", "layout");
  redirect("/pharmacy/onboarding");
}

const saveSchema = z.object({
  name: z.string().min(2, "Enter your pharmacy name"),
  ownerName: z.string().min(2, "Enter the owner's name"),
  phone: z.string().min(5, "Enter a contact number"),
  city: z.string().min(1, "Enter your city or town"),
  licenseNo: z.string().min(3, "Enter your licence number"),
  country: z.string().min(1),
});

/**
 * Persist the pharmacy verification profile. Verified by session, written with
 * the service role (same approach as the doctor's saveOnboarding), promoting a
 * few columns and storing the full payload as JSON.
 */
export async function savePharmacyOnboarding(
  profile: PharmacyProfile
): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Your session expired. Please sign in again." };
  }

  const parsed = saveSchema.safeParse(profile);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please complete the required fields.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("Pharmacy")
    .update({
      name: profile.name,
      ownerName: profile.ownerName,
      licenseNo: profile.licenseNo,
      phone: profile.phone,
      city: profile.city,
      district: profile.district ?? null,
      state: profile.state ?? null,
      country: profile.country,
      services: profile.services,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile: profile as any,
      onboardingComplete: true,
    })
    .eq("authUserId", user.id);

  if (error) {
    return {
      ok: false,
      error: /licenseNo/i.test(error.message)
        ? "That licence number is already registered to another pharmacy."
        : "Could not save your profile. Please try again.",
    };
  }

  return { ok: true };
}
