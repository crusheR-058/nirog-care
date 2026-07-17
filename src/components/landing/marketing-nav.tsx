"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-3.5 sm:px-6">
      <div
        className={cn(
          "mx-auto flex max-w-5xl items-center justify-between rounded-full bg-white/85 py-2 pl-5 pr-2 backdrop-blur-xl transition-shadow duration-300",
          scrolled ? "shadow-lift" : "shadow-quiet"
        )}
      >
        <Link href="/" aria-label="Nirog home">
          <Logo size={25} />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-ink-soft md:flex">
          <a href="#world" className="transition-colors hover:text-ink">
            The care world
          </a>
          <a href="#workspace" className="transition-colors hover:text-ink">
            Doctor workspace
          </a>
          <a href="#trust" className="transition-colors hover:text-ink">
            Trust
          </a>
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-secondary hover:text-ink sm:inline-flex"
          >
            Doctor sign in
          </Link>
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:brightness-110 active:scale-[0.97]"
          >
            Enter workspace <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
