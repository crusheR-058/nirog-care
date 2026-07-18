"use client";

import { useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
  Signal,
  Link2,
  Check,
  CameraOff,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ConsultChannel } from "@/lib/domain/types";
import { CONNECTION } from "@/lib/domain/labels";
import { useCall, useVideoRef } from "@/lib/webrtc/use-call";

/**
 * The live consultation surface — a real WebRTC call. The doctor's camera and
 * mic are captured on Connect; the patient joins from the shareable
 * /call/<room> link and the two peers stream directly to each other. Mute and
 * camera toggles flip the live tracks, so the other side genuinely stops
 * hearing/seeing.
 */
export function ConsultStage({
  room,
  patientName,
  avatarTone,
  channel,
  connection,
}: {
  room: string;
  patientName: string;
  avatarTone?: string;
  channel: ConsultChannel;
  connection: "good" | "fair" | "poor";
}) {
  const call = useCall(room, "doctor", {
    startWithVideo: channel !== "audio",
  });
  const localRef = useVideoRef(call.localStream);
  const remoteRef = useVideoRef(call.remoteStream);

  const [seconds, setSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (call.status !== "connected") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [call.status]);

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;
  const conn = CONNECTION[connection];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/call/${room}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const inCall = call.status === "waiting" || call.status === "connecting" || call.status === "connected";

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-ink shadow-lift">
      <div className="relative aspect-video w-full bg-[radial-gradient(120%_100%_at_50%_0%,#2a2a30_0%,#0c0c0e_70%)]">
        {/* remote (patient) video — the main stage */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          data-remote
          className={cn(
            "absolute inset-0 size-full object-cover",
            call.remoteStream ? "opacity-100" : "opacity-0"
          )}
        />

        {/* local preview — fullscreen while waiting, PiP once connected */}
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          data-local
          className={cn(
            "-scale-x-100 object-cover transition-all duration-500",
            call.remoteStream
              ? "absolute bottom-3 right-3 z-10 h-24 w-36 rounded-xl border border-white/20 shadow-float sm:h-28 sm:w-44"
              : "absolute inset-0 size-full",
            call.localStream && call.camOn ? "opacity-100" : "opacity-0"
          )}
        />

        {/* overlays by state */}
        {call.status === "idle" && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-3 text-white/80">
              <Avatar name={patientName} tone={avatarTone as never} size="lg" />
              <p className="text-sm">{patientName}</p>
              <p className="text-xs text-white/50">
                Connect to start the secure video consultation
              </p>
            </div>
          </div>
        )}

        {call.status === "media-error" && (
          <div className="absolute inset-0 grid place-items-center px-8 text-center">
            <div className="flex flex-col items-center gap-2 text-white/80">
              <CameraOff className="size-7 text-red" />
              <p className="text-sm font-medium">Camera or microphone unavailable</p>
              <p className="text-xs text-white/50">
                Allow camera & mic access in your browser, then try again.
              </p>
            </div>
          </div>
        )}

        {inCall && !call.camOn && !call.remoteStream && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-3 text-white/70">
              <Avatar name={patientName} tone={avatarTone as never} size="lg" />
              <p className="text-xs">Camera off · audio consultation</p>
            </div>
          </div>
        )}

        {(call.status === "waiting" || call.status === "connecting") && (
          <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-green" /> Link copied — send it to the patient
                </>
              ) : (
                <>
                  <Link2 className="size-3.5" />
                  {call.status === "connecting"
                    ? "Connecting to patient…"
                    : "Waiting for patient — copy join link"}
                </>
              )}
            </button>
          </div>
        )}

        {/* status chips */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
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
          {call.status === "connected" && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red/90 px-2.5 py-1 text-xs font-medium text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                LIVE
              </span>
              <span className="tnum rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                {clock}
              </span>
            </>
          )}
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center justify-center gap-2.5 bg-ink px-4 py-3">
        {inCall && (
          <>
            <StageButton
              on={call.micOn}
              onClick={call.toggleMic}
              iconOn={<Mic className="size-5" />}
              iconOff={<MicOff className="size-5" />}
              label="microphone"
            />
            <StageButton
              on={call.camOn}
              onClick={call.toggleCam}
              iconOn={<Video className="size-5" />}
              iconOff={<VideoOff className="size-5" />}
              label="camera"
            />
          </>
        )}

        {!inCall ? (
          <button
            type="button"
            onClick={() => void call.start()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-green px-6 text-sm font-semibold text-white transition-transform active:scale-95"
          >
            <Phone className="size-5" />
            {call.status === "ended" ? "Reconnect" : "Connect"}
          </button>
        ) : (
          <button
            type="button"
            onClick={call.end}
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
        on ? "bg-white/10 text-white hover:bg-white/20" : "bg-red/90 text-white"
      )}
    >
      {on ? iconOn : iconOff}
    </button>
  );
}
