import type {
  ConsultChannel,
  EncounterKind,
  TriageLevel,
} from "@/lib/domain/types";

type Tone = "blue" | "aria" | "green" | "amber" | "red" | "indigo" | "neutral";

export const TRIAGE: Record<
  TriageLevel,
  { label: string; tone: Tone; short: string }
> = {
  emergency: { label: "Emergency", tone: "red", short: "Now" },
  urgent: { label: "Urgent", tone: "amber", short: "Soon" },
  routine: { label: "Routine", tone: "green", short: "Routine" },
};

export const KIND: Record<EncounterKind, string> = {
  new: "New patient",
  follow_up: "Follow-up",
  pediatrics: "Pediatrics",
  chronic: "Chronic care",
  emergency: "Emergency",
};

export const CHANNEL: Record<
  ConsultChannel,
  { label: string; tone: Tone }
> = {
  video: { label: "Video", tone: "blue" },
  audio: { label: "Audio", tone: "indigo" },
  chat: { label: "Chat", tone: "neutral" },
};

export const CONNECTION: Record<
  "good" | "fair" | "poor",
  { label: string; tone: Tone }
> = {
  good: { label: "Strong network", tone: "green" },
  fair: { label: "Fair network", tone: "amber" },
  poor: { label: "Weak network", tone: "red" },
};
