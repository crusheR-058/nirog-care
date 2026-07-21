"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { destinationFor } from "@/lib/auth/destination";

export type SignInState = { error?: string };
export type SignUpState = { error?: string };

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authenticate(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { error: "That email and password don't match our records." };
  }

  revalidatePath("/", "layout");

  // If this account has a TOTP factor, require step-up before the portal.
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect("/verify");
  }

  // Doctors and pharmacies share one auth pool, so route on the account's real
  // role rather than on which form was used — a pharmacy signing in here lands
  // in its own console instead of bouncing through /portal.
  redirect(await destinationFor(data.user.id));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const signupSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(8, "Use at least 8 characters"),
  specialty: z.string().min(2, "Enter your specialty"),
  registrationNo: z.string().min(3, "Enter your medical registration number"),
});

/**
 * Register a new clinician. The account is created confirmed (server-side via
 * the admin client) and a Doctor profile is linked to it. By design a new
 * doctor sees NO patient data until they are provisioned/consented — RLS is the
 * gate. In production this endpoint should sit behind HPR verification / invite.
 */
export async function registerDoctor(
  _prev: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    specialty: formData.get("specialty"),
    registrationNo: formData.get("registrationNo"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const { fullName, email, password, specialty, registrationNo } = parsed.data;
  const admin = createAdminClient();

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (created.error || !created.data.user) {
    const msg = created.error?.message ?? "";
    return {
      error: /already|registered|exists/i.test(msg)
        ? "An account with this email already exists."
        : "Could not create the account. Please try again.",
    };
  }

  const displayName = /^dr\.?\s/i.test(fullName) ? fullName : `Dr. ${fullName}`;
  const doctorId = crypto.randomUUID();
  const profile = await admin.from("Doctor").insert({
    id: doctorId,
    authUserId: created.data.user.id,
    fullName: displayName,
    email,
    specialty,
    registrationNo,
    languages: ["English"],
    clinicName: "Nirog Rural Care Network",
    mfaEnabled: false,
    avatarTone: "blue",
  });
  if (profile.error) {
    // Avoid an orphaned auth user if the profile insert fails.
    await admin.auth.admin.deleteUser(created.data.user.id);
    return {
      error: /registrationNo/i.test(profile.error.message)
        ? "That registration number is already in use."
        : "Could not create your clinician profile.",
    };
  }

  await admin.from("AuditEvent").insert({
    id: crypto.randomUUID(),
    actorId: doctorId,
    actorName: displayName,
    action: "Created clinician account",
    target: "Doctor portal",
    reason: "Self-registration",
    at: new Date().toISOString(),
  });

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });
  revalidatePath("/", "layout");
  redirect("/portal");
}
