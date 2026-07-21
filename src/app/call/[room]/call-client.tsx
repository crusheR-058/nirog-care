"use client";

import { useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  User,
  Video,
  VideoOff,
  PhoneOff,
  Stethoscope,
  CameraOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { useCall, useVideoRef } from "@/lib/webrtc/use-call";

/** Patient side of the consultation — joined via the link the doctor shares. */
export function CallClient({ room }: { room: string }) {
  // No displayName: a public join link knows nothing about who is joining, and
  // announcing a generic label would only override the real name the doctor
  // already has from the queue.
  const call = useCall(room, "patient");
  const localRef = useVideoRef(call.localStream);
  const remoteRef = useVideoRef(call.remoteStream);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (call.status !== "connected") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [call.status]);

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

  if (call.status === "idle" || call.status === "media-error") {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas px-6">
        <div className="w-full max-w-sm text-center">
          <Logo size={28} className="mx-auto mb-8 justify-center" />
          <div className="rounded-3xl border border-hairline bg-panel p-7 shadow-lift">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-soft-blue text-blue">
              <Stethoscope className="size-7" />
            </span>
            <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-ink">
              Your consultation is ready
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              Your doctor is waiting. Join with your camera and microphone —
              you can turn either off at any time.
            </p>
            {call.status === "media-error" && (
              <p className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-soft-red px-3 py-2 text-xs text-red">
                <CameraOff className="size-3.5" />
                Allow camera &amp; mic access in your browser, then try again.
              </p>
            )}
            <button
              type="button"
              onClick={() => void call.start()}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white transition-transform active:scale-[0.97]"
            >
              <Video className="size-4" /> Join consultation
            </button>
            <p className="mt-4 text-[11px] text-ink-faint">
              Secure peer-to-peer call · Nirog Care
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (call.status === "ended") {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas px-6">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-soft-green text-green">
            <CheckCircle2 className="size-7" />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">
            Consultation ended
          </h1>
          <p className="mt-1.5 max-w-xs text-sm text-ink-soft">
            Your care plan and any prescriptions will arrive in the Nirog app.
            Get well soon.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-ink">
      <div className="relative flex-1 overflow-hidden">
        {/* doctor (remote) fills the screen */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          data-remote
          className={cn(
            "absolute inset-0 size-full object-cover",
            call.remoteStream && call.remote.camOn ? "opacity-100" : "opacity-0"
          )}
        />

        {/* doctor turned their camera off → their initial, not a black frame */}
        {call.remoteStream && !call.remote.camOn && (
          <div className="absolute inset-0 grid place-items-center" data-remote-cam-off>
            <div className="flex flex-col items-center gap-3 text-white/85">
              <span className="grid size-24 place-items-center rounded-full bg-soft-blue text-3xl font-semibold text-blue">
                {(call.remote.name ?? "Doctor").trim().replace(/^Dr\.?\s*/i, "").charAt(0).toUpperCase()}
              </span>
              <p className="text-sm font-medium">{call.remote.name ?? "Your doctor"}</p>
              <p className="text-xs text-white/50">Camera is off</p>
            </div>
          </div>
        )}

        {!call.remoteStream && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-3 text-white/75">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">
                {call.status === "connecting"
                  ? "Connecting to your doctor…"
                  : "Waiting for your doctor to join…"}
              </p>
            </div>
          </div>
        )}

        {/* self preview */}
        <div className="absolute bottom-4 right-4 z-10 h-32 w-24 overflow-hidden rounded-xl border border-white/20 shadow-float sm:h-36 sm:w-52">
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
          {!call.camOn && (
            <div
              className="absolute inset-0 grid place-items-center bg-white/5"
              data-local-cam-off
            >
              <span className="grid size-12 place-items-center rounded-full bg-white/10 text-white/80">
                <User className="size-6" />
              </span>
            </div>
          )}
          {!call.micOn && (
            <span className="absolute bottom-1.5 left-1.5 grid size-6 place-items-center rounded-full bg-red/90 text-white">
              <MicOff className="size-3.5" />
            </span>
          )}
        </div>

        {call.status === "connected" && (
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red/90 px-2.5 py-1 text-xs font-medium text-white">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </span>
            <span className="tnum rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {clock}
            </span>
            {!call.remote.micOn && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-amber backdrop-blur"
                data-remote-muted
              >
                <MicOff className="size-3.5" /> Doctor muted
              </span>
            )}
          </div>
        )}
      </div>

      {/* controls */}
      <div className="flex items-center justify-center gap-3 bg-ink px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={call.toggleMic}
          aria-pressed={!call.micOn}
          aria-label={call.micOn ? "Mute microphone" : "Unmute microphone"}
          className={cn(
            "grid size-12 place-items-center rounded-full transition-colors",
            call.micOn ? "bg-white/10 text-white" : "bg-red/90 text-white"
          )}
        >
          {call.micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </button>
        <button
          type="button"
          onClick={call.toggleCam}
          aria-pressed={!call.camOn}
          aria-label={call.camOn ? "Turn camera off" : "Turn camera on"}
          className={cn(
            "grid size-12 place-items-center rounded-full transition-colors",
            call.camOn ? "bg-white/10 text-white" : "bg-red/90 text-white"
          )}
        >
          {call.camOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
        </button>
        <button
          type="button"
          onClick={call.end}
          aria-label="End call"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-red px-7 text-sm font-semibold text-white transition-transform active:scale-95"
        >
          <PhoneOff className="size-5" /> End
        </button>
      </div>
    </main>
  );
}
