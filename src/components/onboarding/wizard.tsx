"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Trash2,
  Globe2,
  User,
  Building2,
  GraduationCap,
  BadgeCheck,
  CalendarClock,
  Wallet,
  ClipboardCheck,
} from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadField } from "@/components/onboarding/upload-field";
import { saveOnboarding } from "@/app/onboarding/actions";
import {
  COUNTRIES,
  countryByCode,
  LANGUAGES,
  SPECIALTIES,
  WEEKDAYS,
  CERTIFICATES,
} from "@/lib/onboarding/config";
import type { OnboardingProfile } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

type Form = Partial<OnboardingProfile> & {
  certificates: Record<string, string | undefined>;
  languages: string[];
  weekdays: string[];
  slots: { day: string; from: string; to: string }[];
};

const STEPS = [
  { title: "About you", icon: User },
  { title: "Practice", icon: Building2 },
  { title: "Qualifications", icon: GraduationCap },
  { title: "Verification", icon: BadgeCheck },
  { title: "Availability", icon: CalendarClock },
  { title: "Payout & more", icon: Wallet },
  { title: "Review", icon: ClipboardCheck },
] as const;

export function OnboardingWizard({
  doctorId,
  email,
  defaults,
}: {
  doctorId: string;
  email: string;
  defaults: Partial<OnboardingProfile>;
}) {
  const [pending, start] = useTransition();
  const [step, setStep] = useState(0);
  const [countryCode, setCountryCode] = useState(
    COUNTRIES.find((c) => c.name === defaults.country)?.code ?? "IN"
  );
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({
    firstName: defaults.firstName ?? "",
    lastName: defaults.lastName ?? "",
    displayName: defaults.displayName ?? "",
    specialty: defaults.specialty ?? "",
    registrationNo:
      defaults.registrationNo && !defaults.registrationNo.startsWith("PENDING")
        ? defaults.registrationNo
        : "",
    languages: defaults.languages ?? ["English"],
    clinicName:
      defaults.clinicName && defaults.clinicName !== "Nirog Rural Care Network"
        ? defaults.clinicName
        : "",
    gender: "male",
    consultType: "both",
    weekdays: [],
    slots: [],
    certificates: {},
  });

  const cfg = useMemo(() => countryByCode(countryCode), [countryCode]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function toggle(key: "languages" | "weekdays", value: string) {
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

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.firstName || !form.lastName) return "Enter your first and last name.";
      if (!form.displayName) return "Enter the name shown to patients.";
      if (!form.mobile) return "Enter your mobile number.";
      if (form.languages.length === 0) return "Pick at least one language.";
    }
    if (step === 1 && !form.clinicName) return "Enter your clinic or hospital name.";
    if (step === 2) {
      if (!form.education) return "List your qualifications (e.g. MBBS, MD).";
      if (form.yearsExperience == null) return "Enter your years of experience.";
      if (!form.specialty) return "Choose your primary specialty.";
    }
    if (step === 3 && !form.registrationNo)
      return `Enter your ${cfg.councilLabel} number.`;
    if (step === 4) {
      if (form.weekdays.length === 0) return "Select at least one available day.";
    }
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
      const res = await saveOnboarding({
        ...(form as OnboardingProfile),
        country: cfg.name,
        currency: cfg.currency,
        councilLabel: cfg.councilLabel,
        taxIdLabel: cfg.taxIdLabel,
        bankRoutingLabel: cfg.bankRoutingLabel,
      });
      if (res.ok) {
        // Hard navigation guarantees the portal re-reads the now-complete
        // profile (a router.push+refresh here can hang the transition).
        window.location.assign("/portal");
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
            className="h-full rounded-full bg-blue transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-hairline bg-panel p-6 shadow-quiet sm:p-8">
        {step === 0 && (
          <Section title="About you" desc="How you appear to patients and how we reach you.">
            <Field label="Country of practice" required>
              <div className="relative">
                <Globe2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-panel pl-9 pr-3 text-sm text-ink"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="First name" required>
                <Input value={form.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} />
              </Field>
              <Field label="Middle name">
                <Input value={form.middleName ?? ""} onChange={(e) => set("middleName", e.target.value)} placeholder="NA if none" />
              </Field>
              <Field label="Last name" required>
                <Input value={form.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name (on platform)" required>
                <Input value={form.displayName ?? ""} onChange={(e) => set("displayName", e.target.value)} placeholder="Dr. …" />
              </Field>
              <Field label="Gender" required>
                <RadioRow value={form.gender ?? "male"} onChange={(v) => set("gender", v as Form["gender"])} options={[["male", "Male"], ["female", "Female"], ["other", "Other"]]} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Mobile" required>
                <Input value={form.mobile ?? ""} onChange={(e) => set("mobile", e.target.value)} placeholder={`${cfg.phoneCode} …`} />
              </Field>
              <Field label="Alternate mobile">
                <Input value={form.altMobile ?? ""} onChange={(e) => set("altMobile", e.target.value)} />
              </Field>
              <Field label="Date of birth">
                <Input type="date" value={form.dateOfBirth ?? ""} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </Field>
            </div>
            <Field label="Languages spoken" required hint="Select every language you can consult in.">
              <ChipMulti options={LANGUAGES} value={form.languages} onToggle={(v) => toggle("languages", v)} />
            </Field>
            <UploadField ownerId={doctorId} storageKey="profile-photo" label="Profile photo" hint="A recent professional headshot." value={form.profilePhotoPath} onChange={(p) => set("profilePhotoPath", p)} />
          </Section>
        )}

        {step === 1 && (
          <Section title="Practice & location" desc="Where you see patients.">
            <Field label="Clinic / hospital name" required>
              <Input value={form.clinicName ?? ""} onChange={(e) => set("clinicName", e.target.value)} placeholder="Clinic or hospital name" />
            </Field>
            <Field label="Street">
              <Input value={form.clinicStreet ?? ""} onChange={(e) => set("clinicStreet", e.target.value)} />
            </Field>
            <Field label="Full address">
              <Textarea rows={2} value={form.clinicAddress ?? ""} onChange={(e) => set("clinicAddress", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City">
                <Input value={form.clinicCity ?? ""} onChange={(e) => set("clinicCity", e.target.value)} />
              </Field>
              <Field label={cfg.stateLabel}>
                <Input value={form.clinicState ?? ""} onChange={(e) => set("clinicState", e.target.value)} />
              </Field>
              <Field label={cfg.pincodeLabel}>
                <Input value={form.clinicPincode ?? ""} onChange={(e) => set("clinicPincode", e.target.value)} />
              </Field>
            </div>
            <Field label="Type of consultation" required>
              <RadioRow value={form.consultType ?? "both"} onChange={(v) => set("consultType", v as Form["consultType"])} options={[["online", "Online"], ["physical", "Physical"], ["both", "Both"]]} />
            </Field>
          </Section>
        )}

        {step === 2 && (
          <Section title="Qualifications" desc="Your degrees and certificates.">
            <Field label="Education" required hint="Comma-separated, e.g. MBBS, MD, DM">
              <Input value={form.education ?? ""} onChange={(e) => set("education", e.target.value)} placeholder="MBBS, MD" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Years of experience" required>
                <Input type="number" min={0} value={form.yearsExperience ?? ""} onChange={(e) => set("yearsExperience", Number(e.target.value))} />
              </Field>
              <Field label="Primary specialty" required>
                <select value={form.specialty ?? ""} onChange={(e) => set("specialty", e.target.value)} className="h-11 w-full rounded-xl border border-input bg-panel px-3 text-sm text-ink">
                  <option value="">Select…</option>
                  {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {CERTIFICATES.map((c) => (
                <UploadField key={c.key} ownerId={doctorId} storageKey={`cert-${c.key}`} label={c.label} required={c.required} value={form.certificates[c.key]} onChange={(p) => setForm((f) => ({ ...f, certificates: { ...f.certificates, [c.key]: p } }))} />
              ))}
            </div>
            <Field label="Awards & recognitions">
              <Textarea rows={2} value={form.awards ?? ""} onChange={(e) => set("awards", e.target.value)} placeholder="Optional" />
            </Field>
          </Section>
        )}

        {step === 3 && (
          <Section title="Identity & registration" desc={`Verification for ${cfg.name}. This is how we confirm you're a licensed clinician.`}>
            <div className="rounded-xl bg-soft-amber/60 px-3.5 py-2.5 text-xs text-amber">
              Please enter a valid {cfg.councilLabel} number. Invalid details will
              delay or reject your profile.
            </div>
            <Field label={`${cfg.councilLabel} number`} required>
              <Input value={form.registrationNo ?? ""} onChange={(e) => set("registrationNo", e.target.value)} placeholder={cfg.councilPlaceholder} />
            </Field>
            <UploadField ownerId={doctorId} storageKey="registration-cert" label={`${cfg.councilLabel} certificate`} required value={form.registrationDocPath} onChange={(p) => set("registrationDocPath", p)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${cfg.taxIdLabel} number`}>
                <Input value={form.taxId ?? ""} onChange={(e) => set("taxId", e.target.value)} />
              </Field>
              <UploadField ownerId={doctorId} storageKey="tax-id" label={`${cfg.taxIdLabel} document`} value={form.taxIdDocPath} onChange={(p) => set("taxIdDocPath", p)} />
            </div>
            <Field label="Government ID type">
              <select value={form.idProofType ?? ""} onChange={(e) => set("idProofType", e.target.value)} className="h-11 w-full rounded-xl border border-input bg-panel px-3 text-sm text-ink">
                <option value="">Select…</option>
                {cfg.idProofOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <UploadField ownerId={doctorId} storageKey="id-front" label="ID — front side" value={form.idProofFrontPath} onChange={(p) => set("idProofFrontPath", p)} />
              <UploadField ownerId={doctorId} storageKey="id-back" label="ID — back side" value={form.idProofBackPath} onChange={(p) => set("idProofBackPath", p)} />
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section title="Availability & fees" desc="When patients can book you and what you charge.">
            <Field label="Available days" required>
              <ChipMulti options={WEEKDAYS} value={form.weekdays} onToggle={(v) => toggle("weekdays", v)} />
            </Field>
            <Field label="Consultation slots" hint="Add the time windows you're available.">
              <div className="flex flex-col gap-2">
                {form.slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={slot.day} onChange={(e) => set("slots", form.slots.map((s, j) => j === i ? { ...s, day: e.target.value } : s))} className="h-10 flex-1 rounded-xl border border-input bg-panel px-2.5 text-sm text-ink">
                      {WEEKDAYS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <Input type="time" value={slot.from} onChange={(e) => set("slots", form.slots.map((s, j) => j === i ? { ...s, from: e.target.value } : s))} className="h-10 w-28" />
                    <Input type="time" value={slot.to} onChange={(e) => set("slots", form.slots.map((s, j) => j === i ? { ...s, to: e.target.value } : s))} className="h-10 w-28" />
                    <button type="button" onClick={() => set("slots", form.slots.filter((_, j) => j !== i))} className="grid size-9 place-items-center rounded-lg text-ink-faint hover:bg-soft-red hover:text-red"><Trash2 className="size-4" /></button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => set("slots", [...form.slots, { day: form.weekdays[0] ?? "Monday", from: "10:00", to: "13:00" }])}>
                  <Plus className="size-4" /> Add slot
                </Button>
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              {(form.consultType === "online" || form.consultType === "both") && (
                <Field label={`Online consultation fee (${cfg.currency})`}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">{cfg.currencySymbol}</span>
                    <Input type="number" min={0} className="pl-7" value={form.onlineFee ?? ""} onChange={(e) => set("onlineFee", Number(e.target.value))} />
                  </div>
                </Field>
              )}
              {(form.consultType === "physical" || form.consultType === "both") && (
                <Field label={`In-person consultation fee (${cfg.currency})`}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">{cfg.currencySymbol}</span>
                    <Input type="number" min={0} className="pl-7" value={form.physicalFee ?? ""} onChange={(e) => set("physicalFee", Number(e.target.value))} />
                  </div>
                </Field>
              )}
            </div>
          </Section>
        )}

        {step === 5 && (
          <Section title="Payout & professional details" desc="Where we send your earnings, plus a few optional extras.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Account holder name">
                <Input value={form.bankAccountName ?? ""} onChange={(e) => set("bankAccountName", e.target.value)} />
              </Field>
              <Field label="Bank name">
                <Input value={form.bankName ?? ""} onChange={(e) => set("bankName", e.target.value)} />
              </Field>
              <Field label="Account number">
                <Input value={form.bankAccountNumber ?? ""} onChange={(e) => set("bankAccountNumber", e.target.value)} />
              </Field>
              <Field label={cfg.bankRoutingLabel}>
                <Input value={form.bankRouting ?? ""} onChange={(e) => set("bankRouting", e.target.value)} />
              </Field>
              {cfg.requiresIban && (
                <Field label="IBAN">
                  <Input value={form.bankIban ?? ""} onChange={(e) => set("bankIban", e.target.value)} />
                </Field>
              )}
              <Field label="Branch">
                <Input value={form.bankBranch ?? ""} onChange={(e) => set("bankBranch", e.target.value)} />
              </Field>
            </div>
            <UploadField ownerId={doctorId} storageKey="cancelled-cheque" label={cfg.code === "IN" ? "Cancelled cheque" : "Void cheque / bank statement"} value={form.cancelledChequePath} onChange={(p) => set("cancelledChequePath", p)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Secretary name">
                <Input value={form.secretaryName ?? ""} onChange={(e) => set("secretaryName", e.target.value)} />
              </Field>
              <Field label="Secretary number">
                <Input value={form.secretaryNumber ?? ""} onChange={(e) => set("secretaryNumber", e.target.value)} />
              </Field>
            </div>
            <Field label="Professional memberships">
              <Input value={form.membership ?? ""} onChange={(e) => set("membership", e.target.value)} />
            </Field>
            <Field label="Conditions & procedures treated">
              <Textarea rows={2} value={form.conditionsTreated ?? ""} onChange={(e) => set("conditionsTreated", e.target.value)} />
            </Field>
            <Field label="Services offered">
              <Textarea rows={2} value={form.servicesOffered ?? ""} onChange={(e) => set("servicesOffered", e.target.value)} />
            </Field>
            <Field label="Research & publications" hint="Comma-separated links, if any.">
              <Input value={form.researchLinks ?? ""} onChange={(e) => set("researchLinks", e.target.value)} />
            </Field>
          </Section>
        )}

        {step === 6 && (
          <Section title="Review & submit" desc="Confirm your details. You can go back to edit any step.">
            <dl className="divide-y divide-hairline rounded-xl border border-hairline">
              <Row k="Name" v={form.displayName} />
              <Row k="Country" v={cfg.name} />
              <Row k="Specialty" v={`${form.specialty} · ${form.yearsExperience ?? 0} yrs`} />
              <Row k="Education" v={form.education} />
              <Row k={`${cfg.councilLabel}`} v={form.registrationNo} />
              <Row k="Languages" v={form.languages.join(", ")} />
              <Row k="Consultation" v={`${form.consultType}${form.onlineFee ? ` · ${cfg.currencySymbol}${form.onlineFee} online` : ""}${form.physicalFee ? ` · ${cfg.currencySymbol}${form.physicalFee} in-person` : ""}`} />
              <Row k="Available" v={form.weekdays.join(", ") || "—"} />
              <Row k="Documents" v={`${countUploads(form)} uploaded`} />
            </dl>
            <p className="text-xs text-ink-faint">
              By submitting, you confirm these details are accurate. Access to
              patient records opens once your registration is verified.
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
              Submit for verification
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

function countUploads(f: Form): number {
  const paths = [
    f.profilePhotoPath, f.registrationDocPath, f.taxIdDocPath,
    f.idProofFrontPath, f.idProofBackPath, f.cancelledChequePath,
    ...Object.values(f.certificates),
  ];
  return paths.filter(Boolean).length;
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

function RadioRow({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex gap-2">
      {options.map(([val, label]) => (
        <button key={val} type="button" onClick={() => onChange(val)} className={cn("flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors", value === val ? "border-blue bg-soft-blue text-blue" : "border-hairline-strong bg-panel text-ink-soft hover:bg-secondary")}>
          {label}
        </button>
      ))}
    </div>
  );
}

function ChipMulti({ options, value, onToggle }: { options: string[]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" onClick={() => onToggle(o)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", on ? "border-transparent bg-ink text-white" : "border-hairline-strong bg-panel text-ink-soft hover:bg-secondary")}>
            {o}
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
