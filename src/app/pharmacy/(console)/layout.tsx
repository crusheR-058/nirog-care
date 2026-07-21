import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "@/app/(auth)/actions";
import { LogoMark } from "@/components/brand/logo";
import { ConsoleRail, ConsoleMobileNav } from "@/components/pharmacy/console-nav";

export const dynamic = "force-dynamic";

/**
 * The pharmacy console shell.
 *
 * Three gates before any dispensing surface renders: signed in, onboarded, and
 * licence-verified. Verification is the same flag RLS keys on, so the UI gate
 * and the data gate can't drift apart.
 */
export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/pharmacy/login");

  const admin = createAdminClient();
  const { data: pharmacy } = await admin
    .from("Pharmacy")
    .select("name,city,district,onboardingComplete,verified")
    .eq("authUserId", user.id)
    .maybeSingle();

  if (!pharmacy) redirect("/portal");
  if (!pharmacy.onboardingComplete) redirect("/pharmacy/onboarding");
  if (!pharmacy.verified) redirect("/pharmacy/status");

  // Deliberately the same shell as the clinician portal — dark ink rail, light
  // canvas, white panels. Two products, one design system.
  const location =
    [pharmacy.district, pharmacy.city]
      .filter(Boolean)
      .filter(
        (part, i, all) =>
          !all.some(
            (other, j) =>
              j < i && other!.toLowerCase().includes(part!.toLowerCase())
          )
      )
      .join(" · ") || "Dispensing console";

  return (
    <div className="flex min-h-dvh bg-canvas">
      {/* rail */}
      <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col items-center gap-1 bg-ink py-5 lg:flex">
        <Link
          href="/pharmacy/dashboard"
          className="mb-4 grid size-11 place-items-center rounded-2xl bg-white/5"
          aria-label="Nirog pharmacy console"
        >
          <LogoMark size={26} className="text-white" />
        </Link>
        <ConsoleRail />
        <form action={logout}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="grid size-11 place-items-center rounded-2xl text-white/45 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-[19px]" />
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-hairline bg-canvas/80 px-5 py-3 backdrop-blur-xl lg:px-8">
          <Link href="/pharmacy/dashboard" className="lg:hidden" aria-label="Nirog">
            <LogoMark size={24} className="text-ink" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-ink">
              {pharmacy.name}
            </p>
            <p className="truncate text-xs text-ink-soft">{location}</p>
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-soft-green px-3 py-1.5 text-[11px] font-semibold text-green">
            <ShieldCheck className="size-3.5" /> Verified
          </span>
        </header>

        <main className="flex-1 px-5 pb-24 pt-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <ConsoleMobileNav />
    </div>
  );
}
