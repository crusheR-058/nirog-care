"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, PackageSearch, Pill, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export const CONSOLE_NAV = [
  {
    href: "/pharmacy/dashboard",
    label: "Command",
    icon: LayoutGrid,
    match: (p: string) => p === "/pharmacy/dashboard",
  },
  {
    href: "/pharmacy/orders",
    label: "Orders",
    icon: PackageSearch,
    match: (p: string) => p.startsWith("/pharmacy/orders"),
  },
  {
    href: "/pharmacy/catalog",
    label: "Catalogue",
    icon: Pill,
    match: (p: string) => p.startsWith("/pharmacy/catalog"),
  },
  {
    href: "/pharmacy/status",
    label: "Profile",
    icon: Store,
    match: (p: string) => p.startsWith("/pharmacy/status"),
  },
] as const;

/** Desktop rail. Mirrors the clinician portal's shape so the two feel related. */
export function ConsoleRail() {
  const pathname = usePathname();
  return (
    <nav className="hidden flex-1 flex-col items-center gap-1.5 lg:flex">
      {CONSOLE_NAV.map(({ href, label, icon: Icon, match }) => {
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
                : "text-ink-faint hover:bg-white/5 hover:text-ink"
            )}
          >
            <Icon className="size-[21px]" />
            <span className="pointer-events-none absolute left-full ml-3 z-30 hidden whitespace-nowrap rounded-lg border border-hairline bg-panel-2 px-2.5 py-1.5 text-xs font-medium text-ink shadow-float group-hover:block">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile bottom bar — max 5 items, icon + label. */
export function ConsoleMobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hairline bg-panel/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {CONSOLE_NAV.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              active ? "text-blue" : "text-ink-faint"
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
