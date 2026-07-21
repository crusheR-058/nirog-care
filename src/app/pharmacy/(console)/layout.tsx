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
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: pharmacy } = await admin
    .from("Pharmacy")
    .select("name,city,district,onboardingComplete,verified")
    .eq("authUserId", user.id)
    .maybeSingle();

  if (!pharmacy) redirect("/portal");
  if (!pharmacy.onboardingComplete) redirect("/pharmacy/onboarding");
  if (!pharmacy.verified) redirect("/pharmacy/status");

  return (
    <div className="pharmacy-console flex min-h-dvh">
      {/* rail */}
      <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col items-center gap-1 border-r border-hairline bg-panel py-5 lg:flex">
        <Link
          href="/pharmacy/dashboard"
          className="mb-4 grid size-11 place-items-center rounded-2xl bg-white/5"
          aria-label="Nirog pharmacy console"
        >
          <LogoMark size={26} className="text-cyan" />
        </Link>
        <ConsoleRail />
        <form action={logout}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="group grid size-11 place-items-center rounded-2xl text-ink-faint transition-colors hover:bg-white/5 hover:text-ink"
          >
            <LogOut className="size-[19px]" />
          </button>
        </form>
      </aside>

      <div className="console-grid flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-hairline bg-panel/80 px-5 py-3 backdrop-blur">
          <Link href="/pharmacy/dashboard" className="lg:hidden" aria-label="Nirog">
            <LogoMark size={24} className="text-cyan" />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold tracking-tight text-ink">
              {pharmacy.name}
            </p>
            <p className="truncate text-xs text-ink-faint">
              {[pharmacy.district, pharmacy.city].filter(Boolean).join(" · ") ||
                "Dispensing console"}
            </p>
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-soft-green px-3 py-1.5 text-[11px] font-semibold text-green">
            <ShieldCheck className="size-3.5" /> Verified
          </span>
        </header>

        <main className="flex-1 px-5 pb-24 pt-5 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <ConsoleMobileNav />
    </div>
  );
}
