"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/components/portal/nav";
import { cn } from "@/lib/utils";

/** Desktop dark icon rail — the pitch's clinical workspace chrome. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col items-center gap-1 bg-ink py-5 lg:flex">
      <Link
        href="/portal"
        className="mb-4 grid size-11 place-items-center rounded-2xl bg-white/5"
        aria-label="Nirog"
      >
        <LogoMark size={26} className="text-white" />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative grid size-11 place-items-center rounded-2xl transition-colors",
                active
                  ? "bg-blue text-white"
                  : "text-white/45 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="size-[21px]" />
              <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white shadow-float group-hover:block">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
