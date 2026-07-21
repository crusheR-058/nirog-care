"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ConsultChannel } from "@/lib/domain/types";
import { CONNECTION } from "@/lib/domain/labels";
import { useCall, useVideoRef } from "@/lib/webrtc/use-call";

/**
 * The live consultation surface — a real WebRTC call.
 *
 * Camera-off is a first-class state, not a black rectangle: each side
 * announces mic/cam over the signalling channel (a disabled video track sends
 * black frames, so the far side cannot detect it from media alone), and the
 * stage renders an initial-letter avatar for whoever is off — the doctor's own
 * initial in the self view, the patient's on the main stage.
 */
export function ConsultStage({
  room,
  patientName,
  doctorName,
  avatarTone,
  channel,
  connection,
}: {
  room: string;
  patientName: string;
  doctorName: string;
  avatarTone?: string;
  channel: ConsultChannel;
  connection: "good" | "fair" | "poor";
}) {
  const call = useCall(room, "doctor", {
    startWithVideo: channel !== "audio",
    displayName: doctorName,
  });
  const localRef = useVideoRef(call.localStream);
  const remoteRef = useVideoRef(call.remoteStream);
  const stageRef = useRef<HTMLDivElement>(null);

  const [seconds, setSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (call.status !== "connected") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [call.status]);

  // Track actual fullscreen state — Esc exits without telling our button.
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stageRef.current?.requestFullscreen();
    } catch {
      // Fullscreen can be denied (iframe policy); the button just no-ops.
    }
  }, []);

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

  const inCall =
    call.status === "waiting" ||
    call.status === "connecting" ||
    call.status === "connected";
  const live = call.status === "connected" && !!call.remoteStream;
  const remoteCamOff = live && !call.remote.camOn;

  return (
    <div
      ref={stageRef}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-hairline bg-ink shadow-lift",
        // In fullscreen the element IS the viewport; let the stage take all of it.
        fullscreen && "h-dvh rounded-none border-0"
      )}
    >
      <div
        className={cn(
          "relative w-full bg-[radial-gradient(120%_100%_at_50%_0%,#2a2a30_0%,#0c0c0e_70%)]",
          fullscreen ? "flex-1" : "aspect-video"
        )}
      >
        {/* remote (patient) video — the main stage */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          data-remote
          className={cn(
            "absolute inset-0 size-full",
            fullscreen ? "object-contain" : "object-cover",
            call.remoteStream && !remoteCamOff ? "opacity-100" : "opacity-0"
          )}
        />

        {/* remote camera off → the patient's initial, not a black box */}
        {remoteCamOff && (
          <div
            className="absolute inset-0 grid place-items-center"
            data-remote-cam-off
          >
            {/* The queue already knows exactly who this patient is — that beats
                the presence channel's self-reported name, which a browser
                patient can only fill with a generic label. */}
            <div className="flex flex-col items-center gap-3 text-white/85">
              <Avatar
                name={patientName}
                tone={avatarTone as never}
                size="lg"
                className="size-24 text-3xl"
              />
              <p className="text-sm font-medium">{patientName}</p>
              <p className="text-xs text-white/50">Camera is off</p>
            </div>
          </div>
        )}

        {/* self view — fullscreen while waiting, PiP once connected */}
        <div
          className={cn(
            "transition-all duration-500",
            call.remoteStream
              ? "absolute bottom-3 right-3 z-10 h-28 w-44 overflow-hidden rounded-xl border border-white/20 shadow-float sm:h-32 sm:w-52"
              : "absolute inset-0"
          )}
        >
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            data-local
            className={cn(
              "size-full -scale-x-100 object-cover",
              call.localStream && call.camOn ? "opacity-100" : "opacity-0"
            )}
          />
          {/* own camera off → the doctor's own initial */}
          {inCall && !call.camOn && (
            <div
              className="absolute inset-0 grid place-items-center bg-white/5"
              data-local-cam-off
            >
              <div className="flex flex-col items-center gap-2 text-white/80">
                <Avatar
                  name={doctorName}
                  tone="blue"
                  size={call.remoteStream ? "default" : "lg"}
                  className={call.remoteStream ? undefined : "size-24 text-3xl"}
                />
                {!call.remoteStream && (
                  <>
                    <p className="text-sm font-medium">{doctorName}</p>
                    <p className="text-xs text-white/50">Your camera is off</p>
                  </>
                )}
              </div>
            </div>
          )}
          {/* own mic muted — visible on the self tile */}
          {inCall && !call.micOn && call.remoteStream && (
            <span className="absolute bottom-1.5 left-1.5 grid size-6 place-items-center rounded-full bg-red/90 text-white">
              <MicOff className="size-3.5" />
            </span>
          )}
        </div>

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
          {/* far side muted — the doctor should know why it's silent */}
          {live && !call.remote.micOn && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-amber backdrop-blur"
              data-remote-muted
            >
              <MicOff className="size-3.5" /> Patient muted
            </span>
          )}
        </div>

        {/* fullscreen toggle */}
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-black/40 text-white/80 backdrop-blur transition-colors hover:bg-black/60 hover:text-white"
        >
          {fullscreen ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </button>
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
