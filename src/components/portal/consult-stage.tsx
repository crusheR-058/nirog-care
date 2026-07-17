"use client";

import { useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
  MessageSquare,
  Signal,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ConsultChannel } from "@/lib/domain/types";
import { CONNECTION } from "@/lib/domain/labels";

/**
 * A mock consultation surface. Real WebRTC would mount here; the point for the
 * portal is the clinical flow around it, including graceful downgrade to audio
 * on weak rural networks (the pitch's "audio-first" differentiator).
 */
export function ConsultStage({
  patientName,
  avatarTone,
  channel,
  connection,
}: {
  patientName: string;
  avatarTone?: string;
  channel: ConsultChannel;
  connection: "good" | "fair" | "poor";
}) {
  const [live, setLive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(channel === "video");

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;
  const conn = CONNECTION[connection];
  const showVideo = cam && channel === "video" && connection !== "poor";

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-ink shadow-lift">
      <div className="relative aspect-video w-full">
        {/* Ambient video placeholder */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,#2a2a30_0%,#0c0c0e_70%)]" />
        <div className="absolute inset-0 grid place-items-center">
          {showVideo ? (
            <div className="flex flex-col items-center gap-3 text-white/80">
              <Avatar name={patientName} tone={avatarTone as never} size="lg" />
              <p className="text-sm">{patientName}</p>
              {live && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red/90 px-2.5 py-0.5 text-xs font-medium text-white">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/70">
              <Avatar name={patientName} tone={avatarTone as never} size="lg" />
              <p className="text-sm">
                {channel === "chat"
                  ? "Chat consultation"
                  : connection === "poor"
                    ? "Audio only · weak network"
                    : "Camera off · audio"}
              </p>
            </div>
          )}
        </div>

        {/* Connection + timer chips */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium backdrop-blur",
              connection === "good"
                ? "text-green"
                : connection === "fair"
                  ? "text-amber"
                  : "text-red"
            )}
          >
            <Signal className="size-3.5" /> {conn.label}
          </span>
          {live && (
            <span className="tnum rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {clock}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2.5 bg-ink px-4 py-3">
        {channel !== "chat" && (
          <>
            <StageButton
              on={mic}
              onClick={() => setMic((v) => !v)}
              iconOn={<Mic className="size-5" />}
              iconOff={<MicOff className="size-5" />}
              label="Mic"
            />
            {channel === "video" && (
              <StageButton
                on={cam}
                onClick={() => setCam((v) => !v)}
                iconOn={<Video className="size-5" />}
                iconOff={<VideoOff className="size-5" />}
                label="Camera"
              />
            )}
          </>
        )}

        {!live ? (
          <button
            type="button"
            onClick={() => setLive(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-green px-6 text-sm font-semibold text-white transition-transform active:scale-95"
          >
            {channel === "chat" ? (
              <MessageSquare className="size-5" />
            ) : (
              <Phone className="size-5" />
            )}
            {channel === "chat" ? "Open chat" : "Connect"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setLive(false)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-red px-6 text-sm font-semibold text-white transition-transform active:scale-95"
          >
            <PhoneOff className="size-5" /> End
          </button>
        )}
      </div>
    </div>
  );
}

function StageButton({
  on,
  onClick,
  iconOn,
  iconOff,
  label,
}: {
  on: boolean;
  onClick: () => void;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${on ? "Mute" : "Unmute"} ${label}`}
      aria-pressed={!on}
      className={cn(
        "grid size-11 place-items-center rounded-full transition-colors",
        on
          ? "bg-white/10 text-white hover:bg-white/20"
          : "bg-red/90 text-white"
      )}
    >
      {on ? iconOn : iconOff}
    </button>
  );
}
