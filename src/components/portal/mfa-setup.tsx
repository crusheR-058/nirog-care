"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2, ShieldCheck, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Enrolling {
  factorId: string;
  qr: string;
  secret: string;
}

/**
 * TOTP two-factor management. Enroll (QR + secret) → verify a 6-digit code, or
 * remove an existing factor. Uses the authenticated browser client; accounts
 * with a verified factor are challenged for a code at sign-in (see /verify).
 */
export function MfaSetup() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<Enrolling | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const totp = data?.totp?.find((f) => f.status === "verified");
    setVerifiedFactorId(totp?.id ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function startEnroll() {
    setBusy(true);
    setError(null);
    // Clean up any half-finished (unverified) factors first.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const f of existing?.all ?? []) {
      if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Nirog ${Date.now()}`,
    });
    if (error || !data) {
      setError(error?.message ?? "Could not start enrolment.");
    } else {
      setEnrolling({
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
    }
    setBusy(false);
  }

  async function verify() {
    if (!enrolling) return;
    setBusy(true);
    setError(null);
    const challenge = await supabase.auth.mfa.challenge({
      factorId: enrolling.factorId,
    });
    if (challenge.error || !challenge.data) {
      setError(challenge.error?.message ?? "Challenge failed.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: enrolling.factorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    if (error) {
      setError("That code didn't match. Check your authenticator and try again.");
    } else {
      setEnrolling(null);
      setCode("");
      await refresh();
    }
    setBusy(false);
  }

  async function remove() {
    if (!verifiedFactorId) return;
    setBusy(true);
    await supabase.auth.mfa.unenroll({ factorId: verifiedFactorId });
    await refresh();
    setBusy(false);
  }

  if (loading) {
    return (
      <div className="py-2">
        <Loader2 className="size-4 animate-spin text-ink-faint" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-ink-soft">
        <KeyRound className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">Two-factor authentication</p>
        <p className="text-xs text-ink-soft">
          Time-based one-time codes (TOTP) from any authenticator app.
        </p>

        {enrolling && (
          <div className="mt-3 rounded-xl border border-hairline bg-panel-2 p-4">
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enrolling.qr}
                alt="Scan this QR code with your authenticator app"
                className="size-36 rounded-lg bg-white p-1"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  Scan the QR with Google Authenticator, Authy or 1Password —
                  or enter the key manually:
                </p>
                <code className="mt-2 block break-all rounded-lg bg-panel px-2.5 py-1.5 font-mono text-xs text-ink-soft">
                  {enrolling.secret}
                </code>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    inputMode="numeric"
                    placeholder="123456"
                    className="tnum h-10 w-28 text-center tracking-[0.3em]"
                  />
                  <Button size="sm" onClick={verify} disabled={busy || code.length < 6}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEnrolling(null);
                      setCode("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 rounded-lg bg-soft-red px-3 py-2 text-xs text-red">
            {error}
          </p>
        )}
      </div>

      <div className="shrink-0">
        {verifiedFactorId ? (
          <div className="flex items-center gap-2">
            <Badge tone="green">
              <ShieldCheck /> Enabled
            </Badge>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="grid size-8 place-items-center rounded-lg text-ink-faint hover:bg-soft-red hover:text-red"
              aria-label="Remove two-factor authentication"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : enrolling ? null : (
          <Button size="sm" variant="outline" onClick={startEnroll} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Enable
          </Button>
        )}
      </div>
    </div>
  );
}
