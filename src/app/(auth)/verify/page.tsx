import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { destinationFor } from "@/lib/auth/destination";
import { Logo } from "@/components/brand/logo";
import { logout } from "@/app/(auth)/actions";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify it's you" };

export default async function VerifyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  // No step-up required (no factor, or already at aal2) → straight through to
  // whichever product this account belongs to.
  if (!aal || aal.nextLevel !== "aal2" || aal.currentLevel === "aal2") {
    redirect(await destinationFor(user.id));
  }

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="mb-8 inline-flex">
          <Logo />
        </Link>

        <div className="rounded-3xl border border-hairline bg-panel p-7 shadow-lift">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-soft-blue text-blue">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-ink">
            Two-factor verification
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Enter the 6-digit code from your authenticator app to finish
            signing in.
          </p>

          <div className="mt-6 text-left">
            <VerifyForm />
          </div>
        </div>

        <form action={logout} className="mt-4">
          <button
            type="submit"
            className="text-xs font-medium text-ink-faint hover:text-ink"
          >
            Sign in as a different account
          </button>
        </form>
      </div>
    </main>
  );
}
