import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Pill,
  Truck,
  ShieldCheck,
  BadgeCheck,
  ArrowLeft,
  IndianRupee,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/brand/logo";
import { PharmacySignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Partner as a pharmacy",
  description:
    "Join Nirog as a partner pharmacy — receive prescriptions from verified doctors and fulfil them for patients in your district.",
};
export const dynamic = "force-dynamic";

const BENEFITS = [
  {
    icon: Pill,
    tone: "bg-soft-blue text-blue",
    title: "Prescriptions, not walk-ins",
    body: "Digitally signed prescriptions arrive from verified Nirog doctors — no handwriting, no ambiguity, no dispensing errors.",
  },
  {
    icon: Truck,
    tone: "bg-soft-indigo text-indigo",
    title: "Serve your whole district",
    body: "Reach villages you could never serve from the counter. Set your own delivery radius and fulfil at your own pace.",
  },
  {
    icon: IndianRupee,
    tone: "bg-soft-green text-green",
    title: "Predictable settlement",
    body: "Every fulfilled order is tracked end to end and settled to your registered account — fully reconciled.",
  },
  {
    icon: ShieldCheck,
    tone: "bg-soft-amber text-amber",
    title: "Compliant by design",
    body: "Licence-verified onboarding, consent-gated patient data and an immutable audit trail on every dispense.",
  },
];

export default async function PharmacyLandingPage() {
  // Already signed in as a pharmacy? Skip straight to their flow.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const admin = createAdminClient();
    const { data: pharmacy } = await admin
      .from("Pharmacy")
      .select("onboardingComplete")
      .eq("authUserId", user.id)
      .maybeSingle();
    if (pharmacy) {
      redirect(pharmacy.onboardingComplete ? "/pharmacy/status" : "/pharmacy/onboarding");
    }
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex items-center justify-between border-b border-hairline bg-panel/70 px-5 py-3.5 backdrop-blur">
        <Link href="/" aria-label="Nirog home">
          <Logo size={26} />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Back to site
        </Link>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
        {/* pitch */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-soft-green px-3.5 py-1.5 text-xs font-semibold text-green">
            <BadgeCheck className="size-3.5" /> Partner programme
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-ink sm:text-5xl">
            Close the loop.
            <br />
            <span className="text-ink-faint">Dispense with Nirog.</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-soft">
            A consultation isn&rsquo;t care until the medicine reaches the
            patient. Partner pharmacies are the{" "}
            <span className="font-semibold text-ink">Fulfil</span> step of the
            Nirog care loop — receiving signed prescriptions and getting
            medicines to people who can&rsquo;t reach a city chemist.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-hairline bg-panel p-4 shadow-quiet"
              >
                <span className={`grid size-9 place-items-center rounded-xl ${b.tone}`}>
                  <b.icon className="size-4.5" />
                </span>
                <h2 className="mt-3 font-display text-sm font-extrabold text-ink">
                  {b.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{b.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-ink-faint">
            Every pharmacy is licence-verified before it can dispense. You&rsquo;ll
            complete a short verification after creating your account.
          </p>
        </div>

        {/* signup */}
        <div className="lg:pt-6">
          <div className="rounded-3xl border border-hairline bg-panel p-6 shadow-quiet sm:p-7">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink">
              Create your pharmacy account
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Takes a minute. Verification comes next.
            </p>
            <div className="mt-5">
              <PharmacySignupForm />
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-ink-soft">
            Already partnered?{" "}
            <Link href="/login" className="font-semibold text-blue hover:underline">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-ink-soft">
            Are you a doctor?{" "}
            <Link href="/signup" className="font-semibold text-blue hover:underline">
              Join as a clinician
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
