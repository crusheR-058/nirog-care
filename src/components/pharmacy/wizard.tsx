"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Globe2,
  Store,
  MapPin,
  BadgeCheck,
  Clock,
  Wallet,
  ClipboardCheck,
} from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadField } from "@/components/onboarding/upload-field";
import { savePharmacyOnboarding } from "@/app/pharmacy/actions";
import {
  PHARMACY_COUNTRIES,
  pharmacyCountryByCode,
  PHARMACY_SERVICES,
  PHARMACY_TYPES,
  PHARMACY_DOCS,
  WEEKDAYS,
  type PharmacyProfile,
} from "@/lib/pharmacy/config";
import { cn } from "@/lib/utils";

type Form = Partial<PharmacyProfile> & {
  services: string[];
  weekdays: string[];
  documents: Record<string, string | undefined>;
};

const STEPS = [
  { title: "Pharmacy", icon: Store },
  { title: "Location", icon: MapPin },
  { title: "Licensing", icon: BadgeCheck },
  { title: "Operations", icon: Clock },
  { title: "Payout", icon: Wallet },
  { title: "Review", icon: ClipboardCheck },
] as const;

export function PharmacyWizard({
  pharmacyId,
  email,
  defaults,
  autoVerify = false,
}: {
  pharmacyId: string;
  email: string;
  defaults: Partial<PharmacyProfile>;
  /** Demo mode: submitting approves immediately, so don't promise a review. */
  autoVerify?: boolean;
}) {
  const [pending, start] = useTransition();
  const [step, setStep] = useState(0);
  const [countryCode, setCountryCode] = useState(
    PHARMACY_COUNTRIES.find((c) => c.name === defaults.country)?.code ?? "IN"
  );
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({
    name: defaults.name ?? "",
    ownerName: defaults.ownerName ?? "",
    licenseNo: defaults.licenseNo ?? "",
    pharmacyType: "Retail pharmacy",
    phone: "",
    city: "",
    services: ["Home delivery"],
    weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    openFrom: "09:00",
    openTo: "21:00",
    documents: {},
  });

  const cfg = useMemo(() => pharmacyCountryByCode(countryCode), [countryCode]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function toggle(key: "services" | "weekdays", value: string) {
    setForm((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(value)
          ? arr.filter((x) => x !== value)
          : [...arr, value],
      };
    });
  }
  function setDoc(key: string, path: string | undefined) {
    setForm((f) => ({ ...f, documents: { ...f.documents, [key]: path } }));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.name) return "Enter your pharmacy name.";
      if (!form.ownerName) return "Enter the owner's name.";
      if (!form.phone) return "Enter a contact number.";
    }
    if (step === 1 && !form.city) return "Enter the city or town you operate in.";
    if (step === 2) {
      if (!form.licenseNo) return `Enter your ${cfg.licenseLabel} number.`;
      if (!form.pharmacistName) return "Enter the registered pharmacist's name.";
      const missing = PHARMACY_DOCS.filter((d) => d.required && !form.documents[d.key]);
      if (missing.length) return `Upload: ${missing[0].label}.`;
    }
    if (step === 3 && form.weekdays.length === 0)
      return "Select at least one operating day.";
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await savePharmacyOnboarding({
        ...(form as PharmacyProfile),
        email,
        country: cfg.name,
        currency: cfg.currency,
        licenseLabel: cfg.licenseLabel,
        pharmacistLabel: cfg.pharmacistLabel,
        taxRegLabel: cfg.taxRegLabel,
        bankRoutingLabel: cfg.bankRoutingLabel,
      });
      if (res.ok) {
        // Hard navigation so the destination re-reads the completed profile.
        // Auto-verified partners go straight to the dispensing console; anyone
        // awaiting a human review lands on the status page.
        window.location.assign(
          autoVerify ? "/pharmacy/dashboard" : "/pharmacy/status"
        );
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <div key={s.title} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "grid size-9 place-items-center rounded-full text-sm font-semibold transition-colors",
                    done
                      ? "bg-green text-white"
                      : active
                        ? "bg-ink text-white"
                        : "bg-secondary text-ink-faint"
                  )}
                >
                  {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                </div>
                <span
                  className={cn(
                    "hidden text-[11px] font-medium sm:block",
                    active ? "text-ink" : "text-ink-faint"
                  )}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-green transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-hairline bg-panel p-6 shadow-quiet sm:p-8">
        {step === 0 && (
          <Section title="Your pharmacy" desc="How your pharmacy appears to Nirog and to patients.">
            <Field label="Country of operation" required>
              <div className="relative">
                <Globe2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-panel pl-9 pr-3 text-sm text-ink"
                >
                  {PHARMACY_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pharmacy name" required>
                <Input name="name" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Owner / proprietor" required>
                <Input name="ownerName" value={form.ownerName ?? ""} onChange={(e) => set("ownerName", e.target.value)} />
              </Field>
            </div>
            <Field label="Type of pharmacy" required>
              <ChipMulti options={PHARMACY_TYPES} value={form.pharmacyType ? [form.pharmacyType] : []} onToggle={(v) => set("pharmacyType", v)} single />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Contact number" required>
                <Input name="phone" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder={`${cfg.phoneCode} …`} />
              </Field>
              <Field label="Alternate number">
                <Input name="altPhone" value={form.altPhone ?? ""} onChange={(e) => set("altPhone", e.target.value)} />
              </Field>
              <Field label="Years operating">
                <Input name="yearsOperating" type="number" min={0} value={form.yearsOperating ?? ""} onChange={(e) => set("yearsOperating", Number(e.target.value))} />
              </Field>
            </div>
          </Section>
        )}

        {step === 1 && (
          <Section title="Location & delivery" desc="Where you dispense, and how far you can reach.">
            <Field label="Street">
              <Input name="street" value={form.street ?? ""} onChange={(e) => set("street", e.target.value)} />
            </Field>
            <Field label="Full address">
              <Input name="address" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City / town" required>
                <Input name="city" value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="District">
                <Input name="district" value={form.district ?? ""} onChange={(e) => set("district", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={cfg.stateLabel}>
                <Input name="state" value={form.state ?? ""} onChange={(e) => set("state", e.target.value)} />
              </Field>
              <Field label={cfg.pincodeLabel}>
                <Input name="pincode" value={form.pincode ?? ""} onChange={(e) => set("pincode", e.target.value)} />
              </Field>
              <Field label="Delivery radius (km)" hint="0 = counter pickup only">
                <Input name="deliveryRadiusKm" type="number" min={0} value={form.deliveryRadiusKm ?? ""} onChange={(e) => set("deliveryRadiusKm", Number(e.target.value))} placeholder="15" />
              </Field>
            </div>
            <UploadField ownerId={pharmacyId} bucket="pharmacy-documents" storageKey="premisesPhoto" label="Storefront / premises photo" hint="Helps us verify the address." value={form.documents.premisesPhoto} onChange={(p) => setDoc("premisesPhoto", p)} />
          </Section>
        )}

        {step === 2 && (
          <Section title="Licensing & verification" desc="Nirog verifies every pharmacy before it can dispense.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={cfg.licenseLabel} required>
                <Input name="licenseNo" value={form.licenseNo ?? ""} onChange={(e) => set("licenseNo", e.target.value)} placeholder={cfg.licensePlaceholder} />
              </Field>
              <Field label="Licence expiry">
                <Input name="licenseExpiry" type="date" value={form.licenseExpiry ?? ""} onChange={(e) => set("licenseExpiry", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Registered pharmacist name" required>
                <Input name="pharmacistName" value={form.pharmacistName ?? ""} onChange={(e) => set("pharmacistName", e.target.value)} />
              </Field>
              <Field label={cfg.pharmacistLabel}>
                <Input name="pharmacistRegNo" value={form.pharmacistRegNo ?? ""} onChange={(e) => set("pharmacistRegNo", e.target.value)} placeholder={cfg.pharmacistPlaceholder} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={cfg.taxRegLabel}>
                <Input name="taxRegNo" value={form.taxRegNo ?? ""} onChange={(e) => set("taxRegNo", e.target.value)} />
              </Field>
              <Field label={cfg.taxIdLabel}>
                <Input name="taxIdNo" value={form.taxIdNo ?? ""} onChange={(e) => set("taxIdNo", e.target.value)} />
              </Field>
              {cfg.controlledLabel && (
                <Field label={cfg.controlledLabel}>
                  <Input name="controlledNo" value={form.controlledNo ?? ""} onChange={(e) => set("controlledNo", e.target.value)} />
                </Field>
              )}
            </div>
            <div className="flex flex-col gap-3 rounded-2xl bg-canvas p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Documents
              </p>
              {PHARMACY_DOCS.map((d) => (
                <UploadField
                  key={d.key}
                  ownerId={pharmacyId}
                  bucket="pharmacy-documents"
                  storageKey={d.key}
                  label={d.label}
                  required={d.required}
                  value={form.documents[d.key]}
                  onChange={(p) => setDoc(d.key, p)}
                />
              ))}
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section title="Operations" desc="When you're open and what you can fulfil.">
            <Field label="Services offered" required hint="Patients see these when their prescription is routed.">
              <ChipMulti options={PHARMACY_SERVICES} value={form.services} onToggle={(v) => toggle("services", v)} />
            </Field>
            <Field label="Operating days" required>
              <ChipMulti options={WEEKDAYS} value={form.weekdays} onToggle={(v) => toggle("weekdays", v)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Opens at">
                <Input name="openFrom" type="time" value={form.openFrom ?? ""} onChange={(e) => set("openFrom", e.target.value)} />
              </Field>
              <Field label="Closes at">
                <Input name="openTo" type="time" value={form.openTo ?? ""} onChange={(e) => set("openTo", e.target.value)} />
              </Field>
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section title="Payout" desc="Where settled orders are paid. You can add this later.">
            <Field label="Account holder name">
              <Input name="bankAccountName" value={form.bankAccountName ?? ""} onChange={(e) => set("bankAccountName", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Account number">
                <Input name="bankAccountNo" value={form.bankAccountNo ?? ""} onChange={(e) => set("bankAccountNo", e.target.value)} />
              </Field>
              <Field label={cfg.bankRoutingLabel}>
                <Input name="bankRouting" value={form.bankRouting ?? ""} onChange={(e) => set("bankRouting", e.target.value)} />
              </Field>
            </div>
            {cfg.requiresIban && (
              <Field label="IBAN">
                <Input name="iban" value={form.iban ?? ""} onChange={(e) => set("iban", e.target.value)} />
              </Field>
            )}
            <UploadField ownerId={pharmacyId} bucket="pharmacy-documents" storageKey="cancelledCheque" label="Cancelled cheque / bank proof" value={form.documents.cancelledCheque} onChange={(p) => setDoc("cancelledCheque", p)} />
          </Section>
        )}

        {step === 5 && (
          <Section
            title="Review & submit"
            desc={
              autoVerify
                ? "Confirm your details — your console opens as soon as you submit."
                : "Confirm your details before sending for verification."
            }
          >
            <dl className="divide-y divide-hairline rounded-2xl border border-hairline bg-canvas">
              <Row k="Pharmacy" v={`${form.name} · ${form.pharmacyType}`} />
              <Row k="Owner" v={form.ownerName} />
              <Row k="Country" v={cfg.name} />
              <Row k="Location" v={[form.city, form.district, form.state].filter(Boolean).join(", ")} />
              <Row k={cfg.licenseLabel} v={form.licenseNo} />
              <Row k="Pharmacist" v={`${form.pharmacistName ?? "—"}${form.pharmacistRegNo ? ` · ${form.pharmacistRegNo}` : ""}`} />
              <Row k="Services" v={form.services.join(", ")} />
              <Row k="Open" v={`${form.weekdays.length} days · ${form.openFrom ?? "—"}–${form.openTo ?? "—"}`} />
              <Row k="Delivery radius" v={form.deliveryRadiusKm != null ? `${form.deliveryRadiusKm} km` : "Counter pickup"} />
              <Row k="Documents" v={`${Object.values(form.documents).filter(Boolean).length} uploaded`} />
            </dl>
            <p className="text-xs text-ink-faint">
              By submitting, you confirm these details are accurate and that your
              licence is current.{" "}
              {autoVerify
                ? "Nirog is running as a demo, so your pharmacy is approved automatically and prescriptions for your area start routing to you straight away."
                : "Prescriptions are routed to you only after Nirog verifies your registration."}
            </p>
          </Section>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-soft-red px-3 py-2 text-sm text-red">
            {error}
          </p>
        )}

        <div className="mt-7 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={back} disabled={step === 0 || pending}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {autoVerify ? "Submit & open console" : "Submit for verification"}
            </Button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-ink-faint">
        Signed in as {email} · your progress is saved on submit
      </p>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{desc}</p>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-red">*</span>}
      </Label>
      {hint && <p className="-mt-1 text-xs text-ink-faint">{hint}</p>}
      {children}
    </div>
  );
}

function ChipMulti({
  options,
  value,
  onToggle,
  single,
}: {
  options: string[];
  value: string[];
  onToggle: (v: string) => void;
  single?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            aria-pressed={on}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              on
                ? "border-transparent bg-ink text-white"
                : "border-hairline-strong bg-panel text-ink-soft hover:bg-secondary"
            )}
          >
            {single && on ? `✓ ${o}` : o}
          </button>
        );
      })}
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string | number }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <dt className="text-sm text-ink-soft">{k}</dt>
      <dd className="max-w-[60%] truncate text-right text-sm font-medium text-ink">{v || "—"}</dd>
    </div>
  );
}
