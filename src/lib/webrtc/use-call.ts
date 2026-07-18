"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type CallRole = "doctor" | "patient";
export type CallStatus =
  | "idle"
  | "media-error"
  | "waiting"
  | "connecting"
  | "connected"
  | "ended";

// STUN gets peers connected on most home/Wi-Fi networks. A TURN relay is
// required for the hard cases — carrier-grade NAT and restrictive mobile
// networks common in rural India — where a direct path can't be found. TURN
// creds are injected via NEXT_PUBLIC_TURN_* env (empty = STUN-only fallback).
const TURN_URLS = (process.env.NEXT_PUBLIC_TURN_URLS ?? "")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    ...(TURN_URLS.length
      ? [
          {
            urls: TURN_URLS,
            username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? "",
            credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? "",
          },
        ]
      : []),
  ],
};

interface Signal {
  kind: "hello" | "offer" | "answer" | "ice" | "bye";
  from: CallRole;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

/**
 * A real 1:1 WebRTC call, signalled over a Supabase Realtime broadcast channel
 * (`call-<room>`). The doctor is the offerer; the patient answers. Both sides
 * announce with "hello" so join order doesn't matter, and a peer reload simply
 * renegotiates with a fresh RTCPeerConnection. Mute/camera toggles flip the
 * live MediaStreamTrack.enabled flags, so the remote side truly stops
 * receiving audio/frames.
 */
export function useCall(
  room: string,
  role: CallRole,
  opts?: { startWithVideo?: boolean }
) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(opts?.startWithVideo ?? true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const chanRef = useRef<RealtimeChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const statusRef = useRef<CallStatus>("idle");
  const startedRef = useRef(false);
  const camOnRef = useRef(camOn);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);

  const setStatusBoth = (s: CallStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  const send = useCallback((payload: Signal) => {
    void chanRef.current?.send({ type: "broadcast", event: "signal", payload });
  }, []);

  const newPc = useCallback(() => {
    pcRef.current?.close();
    pendingIce.current = [];
    const pc = new RTCPeerConnection(RTC_CONFIG);
    streamRef.current
      ?.getTracks()
      .forEach((t) => pc.addTrack(t, streamRef.current!));
    pc.onicecandidate = (e) => {
      if (e.candidate)
        send({ kind: "ice", from: role, candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      if (e.streams[0]) setRemoteStream(e.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "connected") setStatusBoth("connected");
      else if (st === "failed" || st === "disconnected") {
        setRemoteStream(null);
        if (statusRef.current !== "ended") setStatusBoth("waiting");
      }
    };
    pcRef.current = pc;
    return pc;
  }, [role, send]);

  const flushIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    for (const c of pendingIce.current.splice(0)) {
      await pc.addIceCandidate(c).catch(() => {});
    }
  }, []);

  const makeOffer = useCallback(async () => {
    const pc = newPc();
    setStatusBoth("connecting");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    send({ kind: "offer", from: role, sdp: pc.localDescription ?? undefined });
  }, [newPc, role, send]);

  const handleSignal = useCallback(
    async (payload: Signal) => {
      if (!payload || payload.from === role) return;
      try {
        if (payload.kind === "hello") {
          if (role === "doctor") {
            // Re-offer unless we're already live with this peer.
            if (statusRef.current !== "connected") await makeOffer();
          } else if (statusRef.current === "waiting") {
            // Late-joining doctor announced — reply so they offer.
            send({ kind: "hello", from: role });
          }
        } else if (payload.kind === "offer" && role === "patient" && payload.sdp) {
          const pc = newPc();
          setStatusBoth("connecting");
          await pc.setRemoteDescription(payload.sdp);
          await flushIce();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ kind: "answer", from: role, sdp: pc.localDescription ?? undefined });
        } else if (payload.kind === "answer" && role === "doctor" && payload.sdp) {
          await pcRef.current?.setRemoteDescription(payload.sdp);
          await flushIce();
        } else if (payload.kind === "ice" && payload.candidate) {
          const pc = pcRef.current;
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(payload.candidate).catch(() => {});
          } else {
            pendingIce.current.push(payload.candidate);
          }
        } else if (payload.kind === "bye") {
          setRemoteStream(null);
          pcRef.current?.close();
          pcRef.current = null;
          setStatusBoth(role === "doctor" ? "waiting" : "ended");
        }
      } catch (err) {
        console.warn("[call] signal error", err);
      }
    },
    [role, makeOffer, newPc, flushIce, send]
  );

  /** Ask for camera + mic and join the signaling room. Needs a user gesture. */
  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      stream.getVideoTracks().forEach((t) => (t.enabled = camOnRef.current));
      streamRef.current = stream;
      setLocalStream(stream);
    } catch {
      startedRef.current = false;
      setStatusBoth("media-error");
      return;
    }
    setStatusBoth("waiting");

    supabaseRef.current ??= createClient();
    const chan = supabaseRef.current.channel(`call-${room}`, {
      config: { broadcast: { self: false } },
    });
    chan.on("broadcast", { event: "signal" }, ({ payload }) =>
      handleSignal(payload as Signal)
    );
    chan.subscribe((st) => {
      if (st === "SUBSCRIBED") send({ kind: "hello", from: role });
    });
    chanRef.current = chan;
  }, [room, role, handleSignal, send]);

  const toggleMic = useCallback(() => {
    setMicOn((on) => {
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !on));
      return !on;
    });
  }, []);

  const toggleCam = useCallback(() => {
    setCamOn((on) => {
      camOnRef.current = !on;
      streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !on));
      return !on;
    });
  }, []);

  const teardown = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    if (chanRef.current && supabaseRef.current) {
      void supabaseRef.current.removeChannel(chanRef.current);
    }
    chanRef.current = null;
    startedRef.current = false;
  }, []);

  const end = useCallback(() => {
    send({ kind: "bye", from: role });
    teardown();
    setStatusBoth("ended");
  }, [role, send, teardown]);

  // Clean up everything if the component unmounts mid-call.
  useEffect(() => {
    return () => {
      if (startedRef.current) {
        void chanRef.current?.send({
          type: "broadcast",
          event: "signal",
          payload: { kind: "bye", from: role } satisfies Signal,
        });
      }
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    micOn,
    camOn,
    localStream,
    remoteStream,
    start,
    toggleMic,
    toggleCam,
    end,
  };
}

/** Binds a MediaStream to a <video> element. */
export function useVideoRef(stream: MediaStream | null) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return ref;
}
