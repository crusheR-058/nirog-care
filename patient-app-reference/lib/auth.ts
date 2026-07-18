// Nirog patient app — phone-OTP auth (the India-standard sign-in).
// Requires the Phone provider enabled in Supabase Auth with an SMS gateway
// (MSG91 / Twilio / Vonage). Each patient is a Supabase auth.users row; on
// first sign-in we ensure an Account row (authUserId = the user's uid), which
// owns their patient profiles. RLS (current_account_id()) keys off this.
import { supabase } from "./supabase";

/** Step 1 — send the 6-digit code over SMS. `phone` must be E.164, e.g. +9198…. */
export async function sendOtp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
}

/** Step 2 — verify the code; creates/opens the session. */
export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error) throw error;
  await ensureAccount(phone);
  return data.session;
}

/**
 * Ensure this auth user has an Account. The account_upsert RPC (defined in
 * supabase/patient-access.sql as an optional helper, or do it via an Edge
 * Function) links authUserId → Account. Simplest: an Edge Function with the
 * service role, since a brand-new user has no Account row to update yet and
 * RLS won't let them insert one for an arbitrary id.
 */
async function ensureAccount(phone: string) {
  // Calls a Postgres function `ensure_account(phone)` running as SECURITY
  // DEFINER that inserts { id, phone, authUserId: auth.uid() } if absent.
  const { error } = await supabase.rpc("ensure_account", { p_phone: phone });
  if (error) console.warn("ensure_account:", error.message);
}

export async function signOut() {
  await supabase.auth.signOut();
}
