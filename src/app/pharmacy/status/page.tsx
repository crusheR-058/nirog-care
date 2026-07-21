import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  Clock3,
  MapPin,
  Pill,
  ShieldCheck,
  Truck,
  Store,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { selfApprovePharmacy } from "@/app/pharmacy/actions";
import { pharmacyAutoVerify } from "@/lib/pharmacy/verification";

export const metadata: Metadata = { title: "Pharmacy status" };
export const dynamic = "force-dynamic";

export default async function PharmacyStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: activationError } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: pharmacy } = await admin
    .from("Pharmacy")
    .select("*")
    .eq("authUserId", user.id)
    .maybeSingle();

  if (!pharmacy) redirect("/portal");
  if (!pharmacy.onboardingComplete) redirect("/pharmacy/onboarding");

  const autoVerify = pharmacyAutoVerify();

  const verified = pharmacy.verified as boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = (pharmacy.profile ?? {}) as any;
  const docCount = Object.values(profile.documents ?? {}).filter(Boolean).length;

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex items-center justify-between border-b border-hairline bg-panel/70 px-5 py-3.5 backdrop-blur">
        <Link href="/" aria-label="Nirog home">
          <Logo size={26} />
        </Link>
        <form action={logout}>
          <button type="submit" className="text-sm font-medium text-ink-soft hover:text-ink">
            Sign out
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        {/* status banner */}
        <div
          className={`rounded-3xl border p-6 shadow-quiet sm:p-8 ${
            verified ? "border-green/40 bg-soft-green/40" : "border-amber/40 bg-soft-amber/40"
          }`}
        >
          <span
            className={`grid size-12 place-items-center rounded-2xl ${
              verified ? "bg-green text-white" : "bg-amber text-white"
            }`}
          >
            {verified ? <BadgeCheck className="size-6" /> : <Clock3 className="size-6" />}
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {verified ? "You're verified and live" : "Verification in review"}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
            {verified
              ? "Your pharmacy is approved. Prescriptions from Nirog doctors in your area will be routed to you for fulfilment."
              : autoVerify
                ? "Nirog is running as a demo, so no manual licence review takes place. Activate your console to start receiving prescriptions for your area."
                : "Thanks — your details are with our verification team. We check your licence and premises against the issuing authority, usually within 2–3 working days. We'll email you the moment you're approved."}
          </p>

          {verified ? (
            <div className="mt-5">
              <Button asChild>
                <Link href="/pharmacy/dashboard">Open dispensing console</Link>
              </Button>
            </div>
          ) : autoVerify ? (
            <form action={selfApprovePharmacy} className="mt-5">
              <Button type="submit">Activate console</Button>
              {activationError && (
                <p role="alert" className="mt-2 text-xs font-medium text-red">
                  {activationError}
                </p>
              )}
            </form>
          ) : null}
          {!verified && (
            <div className="mt-5 flex flex-wrap gap-2">
              {["Licence submitted", `${docCount} documents`, "Awaiting review"].map((t) => (
                <span key={t} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink-soft">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* submitted profile */}
        <section className="mt-6 rounded-3xl border border-hairline bg-panel p-6 shadow-quiet sm:p-8">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">
            Your submission
          </h2>
          <dl className="mt-4 divide-y divide-hairline rounded-2xl border border-hairline bg-canvas">
            <Row icon={Store} k="Pharmacy" v={`${pharmacy.name}${profile.pharmacyType ? ` · ${profile.pharmacyType}` : ""}`} />
            <Row icon={ShieldCheck} k={profile.licenseLabel ?? "Licence"} v={pharmacy.licenseNo} />
            <Row icon={MapPin} k="Location" v={[pharmacy.city, pharmacy.district, pharmacy.state, pharmacy.country].filter(Boolean).join(", ")} />
            <Row icon={Truck} k="Delivery radius" v={profile.deliveryRadiusKm != null ? `${profile.deliveryRadiusKm} km` : "Counter pickup"} />
            <Row icon={Pill} k="Services" v={(pharmacy.services ?? []).join(", ") || "—"} />
          </dl>

          <p className="mt-4 text-xs text-ink-faint">
            Need to correct something?{" "}
            <Link href="/pharmacy/onboarding" className="font-semibold text-blue hover:underline">
              Update your details
            </Link>
            .
          </p>
        </section>

        {/* what happens next */}
        <section className="mt-6 rounded-3xl border border-hairline bg-panel p-6 shadow-quiet sm:p-8">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">
            What happens next
          </h2>
          <ol className="mt-4 flex flex-col gap-4">
            {[
              ["Licence verification", "We validate your drug licence and registered pharmacist against the issuing authority."],
              ["Go live in your district", "Once approved, prescriptions from Nirog doctors near you start routing to your queue."],
              ["Fulfil and settle", "Accept an order, dispense, and mark it delivered — settlement follows automatically."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{t}</p>
                  <p className="text-sm text-ink-soft">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  k,
  v,
}: {
  icon: typeof Store;
  k: string;
  v?: string | number | null;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="inline-flex items-center gap-2 text-sm text-ink-soft">
        <Icon className="size-4 text-ink-faint" /> {k}
      </dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-ink">{v || "—"}</dd>
    </div>
  );
}
