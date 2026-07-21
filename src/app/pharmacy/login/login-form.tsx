"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import {
  authenticatePharmacy,
  type PharmacySignUpState,
} from "@/app/pharmacy/actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> Verifying…
        </>
      ) : (
        <>
          Open dispensing console <ArrowRight />
        </>
      )}
    </Button>
  );
}

export function PharmacyLoginForm() {
  const [state, formAction] = useActionState<PharmacySignUpState, FormData>(
    authenticatePharmacy,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Business email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@pharmacy.in"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-soft-red px-3 py-2 text-sm text-red"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />

      <div className="mt-1 flex items-start gap-2 rounded-xl bg-soft-green/60 px-3 py-2.5 text-xs text-green">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <span>
          Dispensing access is licence-gated. You&rsquo;ll only see prescriptions
          routed to the district your pharmacy is registered in.
        </span>
      </div>
    </form>
  );
}
