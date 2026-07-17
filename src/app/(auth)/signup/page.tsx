import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity, BadgeCheck, FileHeart, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/logo";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create account" };

const points = [
  { icon: BadgeCheck, text: "Your identity, verified against your medical registration" },
  { icon: FileHeart, text: "Patients grant consent — you only see what you're allowed to" },
  { icon: ShieldCheck, text: "Every access is logged; the database enforces the rules" },
];

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/portal");

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand / trust panel */}
      <section className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12 text-white">
        <div className="pointer-events-none absolute -right-24 top-1/4 size-[460px] rounded-full bg-aria/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-10 size-[320px] rounded-full bg-blue/20 blur-3xl" />

        <Link href="/" className="relative z-10 flex items-center gap-2">
          <Logo wordmarkClassName="text-white" />
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            <Activity className="size-3.5 text-lblue" /> Join the network
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight">
            Bring trusted care
            <br />
            to where it&rsquo;s
            <br />
            needed most.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            Create your clinician workspace in a minute. Access to real patient
            records opens only once your care relationships are in place.
          </p>

          <ul className="mt-9 flex flex-col gap-4">
            {points.map(({ icon: Icon, text }) => (
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
            Create your workspace
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            For verified clinicians on the Nirog network.
          </p>

          <div className="mt-7">
            <SignupForm />
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-blue hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
