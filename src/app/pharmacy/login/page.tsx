import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Pill, Truck, IndianRupee, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { destinationFor } from "@/lib/auth/destination";
import { Logo } from "@/components/brand/logo";
import { PharmacyLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Pharmacy sign in" };
export const dynamic = "force-dynamic";

const trustPoints = [
  { icon: Pill, text: "Digitally signed prescriptions from verified clinicians" },
  { icon: Truck, text: "Orders routed to your district — accept what you can fulfil" },
  { icon: IndianRupee, text: "Every dispense tracked end to end and settled" },
];

export default async function PharmacyLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(await destinationFor(user.id));

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand / trust panel — mirrors the clinician sign-in, green accent so a
          partner can tell at a glance they're in the right place. */}
      <section className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12 text-white">
        <div className="pointer-events-none absolute -right-24 top-1/4 size-[460px] rounded-full bg-green/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-10 size-[320px] rounded-full bg-blue/20 blur-3xl" />

        <Link href="/" className="relative z-10 flex items-center gap-2">
          <Logo wordmarkClassName="text-white" />
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            <Store className="size-3.5 text-green" /> Partner pharmacy
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight">
            A consultation
            <br />
            isn&rsquo;t care until
            <br />
            the medicine arrives.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            Prescriptions reach your counter the moment a Nirog clinician files
            them — dispense, deliver and close the loop.
          </p>

          <ul className="mt-9 flex flex-col gap-4">
            {trustPoints.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/10">
                  <Icon className="size-4 text-green" />
                </span>
                <span className="text-sm text-white/75">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          Nirog Care Platform · Licence-verified dispensing
        </p>
      </section>

      {/* Form panel */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex lg:hidden">
            <Logo />
          </Link>

          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
            Pharmacy sign in
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Open your dispensing console.
          </p>

          <div className="mt-8">
            <PharmacyLoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Not partnered yet?{" "}
            <Link href="/pharmacy" className="font-semibold text-green hover:underline">
              Register your pharmacy
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-ink-faint">
            Are you a clinician?{" "}
            <Link href="/login" className="font-medium text-ink-soft hover:text-ink hover:underline">
              Doctor sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
