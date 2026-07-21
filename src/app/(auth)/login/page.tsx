import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Activity,
  Stethoscope,
  FileHeart,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { destinationFor } from "@/lib/auth/destination";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const trustPoints = [
  { icon: Stethoscope, text: "Verified clinician access with MFA and passkeys" },
  { icon: FileHeart, text: "Consent-gated records — the patient grants, you view" },
  { icon: Users, text: "One workspace across desktop, tablet and mobile browser" },
];

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Already signed in → their own product, not always the portal.
  if (user) redirect(await destinationFor(user.id));

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand / trust panel */}
      <section className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12 text-white">
        <div className="pointer-events-none absolute -right-24 top-1/4 size-[460px] rounded-full bg-blue/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-10 size-[320px] rounded-full bg-aria/20 blur-3xl" />

        <Link href="/" className="relative z-10 flex items-center gap-2">
          <Logo wordmarkClassName="text-white" />
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            <Activity className="size-3.5 text-lblue" /> Doctor workspace
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight">
            A clinical workspace,
            <br />
            not a stretched
            <br />
            mobile screen.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            Review ARIA&rsquo;s AI intake, run the consult, and file the care
            plan — every interaction stitched into one continuous care episode.
          </p>

          <ul className="mt-9 flex flex-col gap-4">
            {trustPoints.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/10">
                  <Icon className="size-4 text-lblue" />
                </span>
                <span className="text-sm text-white/75">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          Nirog Care Platform · Designed for DPDP + ABDM
        </p>
      </section>

      {/* Form panel */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex lg:hidden">
            <Logo />
          </Link>

          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
            Welcome back, Doctor
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Sign in to open today&rsquo;s queue.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            New clinician?{" "}
            <Link href="/signup" className="font-semibold text-blue hover:underline">
              Create an account
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-ink-faint">
            Partner pharmacy?{" "}
            <Link
              href="/pharmacy/login"
              className="font-medium text-ink-soft hover:text-ink hover:underline"
            >
              Pharmacy sign in
            </Link>
          </p>

          <p className="mt-2 text-center text-xs text-ink-faint">
            Patient?{" "}
            <span className="text-ink-soft">
              Care continues in the Nirog mobile app.
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
