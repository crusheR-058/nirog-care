import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDataSource } from "@/lib/data/source";
import { Sidebar } from "@/components/portal/sidebar";
import { MobileNav } from "@/components/portal/mobile-nav";
import { Topbar } from "@/components/portal/topbar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce MFA step-up: an account with a factor must reach aal2 first.
  const supabase = await createClient();
  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel === "aal1") {
    redirect("/verify");
  }

  const ds = await getDataSource();
  const doctor = await ds.getDoctor();

  // New clinicians must finish verification before they can see any patients.
  if (!doctor.onboardingComplete) redirect("/onboarding");

  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar doctor={doctor} />
        <main className="flex-1 px-5 pb-24 pt-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
