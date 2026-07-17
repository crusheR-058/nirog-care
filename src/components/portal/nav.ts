import {
  LayoutGrid,
  Users,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match nested routes (e.g. /portal/patients/123). */
  match: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/portal",
    label: "Today",
    icon: LayoutGrid,
    match: (p) => p === "/portal",
  },
  {
    href: "/portal/patients",
    label: "Patients",
    icon: Users,
    match: (p) => p.startsWith("/portal/patients") || p.startsWith("/portal/consult"),
  },
  {
    href: "/portal/audit",
    label: "Trust log",
    icon: ShieldCheck,
    match: (p) => p.startsWith("/portal/audit"),
  },
  {
    href: "/portal/settings",
    label: "Settings",
    icon: Settings,
    match: (p) => p.startsWith("/portal/settings"),
  },
];
