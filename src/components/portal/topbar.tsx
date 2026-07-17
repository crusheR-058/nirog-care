"use client";

import { useState } from "react";
import { LogOut, ChevronDown, BadgeCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { logout } from "@/app/(auth)/actions";
import type { Doctor } from "@/lib/domain/types";
import { formatDate } from "@/lib/utils";

export function Topbar({ doctor }: { doctor: Doctor }) {
  const [open, setOpen] = useState(false);
  const today = formatDate(new Date().toISOString());

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-hairline bg-canvas/80 px-5 py-3 backdrop-blur-xl lg:px-8">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-ink">
          {doctor.clinicName}
        </p>
        <p className="truncate text-xs text-ink-soft">
          {today} · {doctor.specialty}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-secondary"
          >
            <Avatar name={doctor.fullName} size="sm" tone="blue" />
            <span className="hidden text-sm font-medium text-ink sm:inline">
              {doctor.fullName}
            </span>
            <ChevronDown className="size-4 text-ink-faint" />
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-hairline bg-popover p-2 shadow-float">
                <div className="rounded-xl px-3 py-2.5">
                  <p className="text-sm font-semibold text-ink">
                    {doctor.fullName}
                  </p>
                  <p className="text-xs text-ink-soft">{doctor.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="green" size="sm">
                      <BadgeCheck /> HPR verified
                    </Badge>
                    {doctor.mfaEnabled && (
                      <Badge tone="blue" size="sm">
                        MFA on
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-ink-faint">
                    {doctor.registrationNo}
                  </p>
                </div>
                <form action={logout}>
                  <button
                    type="submit"
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red transition-colors hover:bg-soft-red"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
