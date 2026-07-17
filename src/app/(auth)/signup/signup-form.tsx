"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { registerDoctor, type SignUpState } from "@/app/(auth)/actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoogleButton, AuthDivider } from "@/components/auth/google-button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> Creating account…
        </>
      ) : (
        <>
          Create clinician account <ArrowRight />
        </>
      )}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState<SignUpState, FormData>(
    registerDoctor,
    {}
  );

  return (
    <div>
      <GoogleButton label="Sign up with Google" />
      <AuthDivider />
      <form action={formAction} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" placeholder="Ananya Rao" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@clinic.health"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="specialty">Specialty</Label>
          <Input
            id="specialty"
            name="specialty"
            placeholder="General Physician"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="registrationNo">Registration no.</Label>
          <Input
            id="registrationNo"
            name="registrationNo"
            placeholder="HPR-…"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
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

      <div className="mt-1 flex items-start gap-2 rounded-xl bg-soft-amber/60 px-3 py-2.5 text-xs text-amber">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <span>
          New accounts have no patient access until a care relationship or
          consent is granted — verification (HPR) gates real clinical data.
        </span>
      </div>
      </form>
    </div>
  );
}
