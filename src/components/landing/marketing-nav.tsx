"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  ["Care journey", "#care-journey"],
  ["The care world", "#world"],
  ["Features", "#features"],
  ["Trust", "#trust"],
] as const;

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-3.5 sm:px-6">
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between rounded-full py-2 pl-5 pr-2 transition-all duration-500",
          scrolled
            ? "bg-white/80 shadow-lift backdrop-blur-xl"
            : "bg-transparent"
        )}
      >
        <Link href="/" aria-label="Nirog home">
          <Logo size={25} />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-ink-soft lg:flex">
          {LINKS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="group relative py-1 transition-colors hover:text-ink"
            >
              {label}
              <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-white/60 hover:text-ink sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
          >
            Start Consultation <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
