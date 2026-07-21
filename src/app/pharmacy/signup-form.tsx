"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { registerPharmacy, type PharmacySignUpState } from "@/app/pharmacy/actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
          Create pharmacy account <ArrowRight />
        </>
      )}
    </Button>
  );
}

export function PharmacySignupForm() {
  const [state, formAction] = useActionState<PharmacySignUpState, FormData>(
    registerPharmacy,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Pharmacy name</Label>
        <Input id="name" name="name" placeholder="Sharma Medical Store" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ownerName">Owner / proprietor name</Label>
        <Input id="ownerName" name="ownerName" placeholder="Rakesh Sharma" required />
      </div>

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
        <Label htmlFor="licenseNo">Drug licence number</Label>
        <Input
          id="licenseNo"
          name="licenseNo"
          placeholder="20B/UP/2024/12345"
          required
        />
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
        <p role="alert" className="rounded-lg bg-soft-red px-3 py-2 text-sm text-red">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <div className="mt-1 flex items-start gap-2 rounded-xl bg-soft-amber/60 px-3 py-2.5 text-xs text-amber">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <span>
          Your licence is verified before you can dispense. No patient data is
          visible until an order is routed to you.
        </span>
      </div>
    </form>
  );
}
