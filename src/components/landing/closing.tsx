"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Eye,
  FileHeart,
  Server,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

const ease = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const pillars = [
  { icon: Eye, title: "Every read logged", body: "Who, what and why — an immutable trail." },
  { icon: Lock, title: "Consent-gated", body: "The patient grants; the server enforces." },
  { icon: ShieldCheck, title: "RLS on every table", body: "The public API returns nothing." },
  { icon: FileHeart, title: "DPDP + ABDM", body: "Consent, ABHA and FHIR shaped in." },
];

export function Closing() {
  return (
    <>
      {/* Trust */}
      <section id="trust" className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-green shadow-quiet">
                Trust architecture
              </span>
              <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                <span className="text-ink">The client requests.</span>
                <br />
                <span className="text-ink-faint">The server decides.</span>
              </h2>
              <p className="mt-4 max-w-md text-lg text-ink-soft">
                Real health data raises the engineering standard. Identity,
                consent and audit sit between every client and every record —
                enforced by the database, not hoped for in the UI.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-4">
                {pillars.map((p) => (
                  <div
                    key={p.title}
                    className="rounded-[1.5rem] bg-white p-5 shadow-quiet"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-soft-green text-green">
                      <p.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display text-sm font-extrabold text-ink">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      {p.body}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-20 text-center text-white sm:px-16">
              <div className="pointer-events-none absolute -left-16 -top-16 size-80 rounded-full bg-blue/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-10 size-80 rounded-full bg-aria/25 blur-3xl" />
              <div className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 rounded-full bg-green/15 blur-3xl" />
              <span className="relative inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-lblue">
                Live demo
              </span>
              <h2 className="relative mt-5 font-display text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
                Step into today&rsquo;s queue.
              </h2>
              <p className="relative mx-auto mt-4 max-w-lg text-white/65">
                Sign in and review a waiting patient — voice intake to filed care
                plan — on realistic demo data.
              </p>
              <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/portal"
                  className="inline-flex h-13 items-center gap-2 rounded-full bg-white px-8 text-[15px] font-semibold text-ink transition-transform hover:bg-white/90 active:scale-[0.97]"
                >
                  Enter the workspace <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-13 items-center rounded-full px-7 text-[15px] font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Create a clinician account
                </Link>
              </div>
              <p className="relative mt-7 inline-flex items-center gap-2 text-xs text-white/40">
                <Server className="size-3.5" /> ananya.rao@nirog.health · nirog-demo
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo size={26} />
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              Continuous care for rural India, built to go global.
            </p>
          </div>
          <FooterCol
            title="Platform"
            links={[
              ["The care world", "#world"],
              ["Workspace", "#workspace"],
              ["Trust", "#trust"],
            ]}
          />
          <FooterCol
            title="Product"
            links={[
              ["Doctor portal", "/portal"],
              ["Sign in", "/login"],
              ["Create account", "/signup"],
            ]}
          />
          <FooterCol
            title="Standards"
            links={[
              ["DPDP 2025", "#trust"],
              ["ABDM / ABHA", "#trust"],
              ["HPR verification", "#trust"],
            ]}
          />
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-hairline pt-6 text-xs text-ink-faint sm:flex-row">
          <p>Nirog Care Platform · A product &amp; architecture demo — not medical advice.</p>
          <p>© 2026 Nirog</p>
        </div>
      </footer>
    </>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">
        {title}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
