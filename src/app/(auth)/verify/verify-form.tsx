"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function VerifyForm() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp?.find((f) => f.status === "verified");
      setFactorId(totp?.id ?? null);
    });
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError(null);
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error || !challenge.data) {
      setError("Couldn't start the challenge. Try again.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    if (error) {
      setError("That code didn't match. Try the current code from your app.");
      setBusy(false);
      return;
    }
    router.push("/portal");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoFocus
        placeholder="123456"
        aria-label="Authentication code"
        className="tnum h-14 text-center text-2xl tracking-[0.4em]"
      />
      {error && (
        <p role="alert" className="rounded-lg bg-soft-red px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy || code.length < 6}>
        {busy ? (
          <>
            <Loader2 className="animate-spin" /> Verifying…
          </>
        ) : (
          <>
            <ShieldCheck className="size-4" /> Verify &amp; continue{" "}
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
