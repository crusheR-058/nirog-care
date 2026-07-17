"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { authenticate, type SignInState } from "@/app/(auth)/actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoogleButton, AuthDivider } from "@/components/auth/google-button";

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
          Enter workspace <ArrowRight />
        </>
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<SignInState, FormData>(
    authenticate,
    {}
  );

  return (
    <div>
      <GoogleButton label="Sign in with Google" />
      <AuthDivider />
      <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@clinic.health"
          defaultValue="ananya.rao@nirog.health"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <span className="text-xs text-ink-faint">Passkey ready</span>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          defaultValue="nirog-demo"
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

      <div className="mt-1 flex items-start gap-2 rounded-xl bg-soft-blue/60 px-3 py-2.5 text-xs text-blue">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <span>
          Two-factor authentication (TOTP) can be enabled in Settings; accounts
          with a factor are challenged for a code at sign-in.
        </span>
      </div>
      </form>
    </div>
  );
}
