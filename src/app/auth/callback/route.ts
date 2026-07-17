import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * OAuth callback (e.g. Google). Exchanges the code for a session, then ensures
 * the auth user has a Doctor profile — first-time OAuth clinicians get a minimal
 * profile (registration marked PENDING) so RLS still gives them no patient data
 * until they're verified/provisioned.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("Doctor")
    .select("id")
    .eq("authUserId", data.user.id)
    .maybeSingle();

  if (!existing) {
    const meta = (data.user.user_metadata ?? {}) as {
      full_name?: string;
      name?: string;
    };
    const raw =
      meta.full_name ||
      meta.name ||
      data.user.email?.split("@")[0] ||
      "Clinician";
    const doctorId = crypto.randomUUID();
    await admin.from("Doctor").insert({
      id: doctorId,
      authUserId: data.user.id,
      fullName: /^dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`,
      email: data.user.email,
      specialty: "General Physician",
      registrationNo: `PENDING-${data.user.id.slice(0, 8)}`,
      languages: ["English"],
      clinicName: "Nirog Rural Care Network",
      mfaEnabled: false,
      avatarTone: "indigo",
    });
    await admin.from("AuditEvent").insert({
      id: crypto.randomUUID(),
      actorId: doctorId,
      actorName: /^dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`,
      action: "Created clinician account",
      target: "Doctor portal",
      reason: "Google sign-in",
      at: new Date().toISOString(),
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
