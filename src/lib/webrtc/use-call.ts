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
// networks common in rural India — where a direct path can't be found.
//
// Credentials are fetched from /api/ice rather than read from NEXT_PUBLIC_*
// env: TURN egress is metered and billable, so a credential embedded in the
// client bundle is a standing invitation to use our relay for free. The
// endpoint mints a short-lived HMAC credential per caller instead.
const STUN_ONLY: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

/**
 * Fetch ICE servers for this call. Falls back to STUN-only if the endpoint is
 * unreachable — a degraded call beats no call, and the failure is visible in
 * the diagnostics panel rather than silently blocking the consultation.
 */
async function fetchRtcConfig(): Promise<RTCConfiguration> {
  try {
    const res = await fetch("/api/ice", { cache: "no-store" });
    if (!res.ok) throw new Error(`ice ${res.status}`);
    const json = (await res.json()) as { iceServers?: RTCIceServer[] };
    if (!json.iceServers?.length) return STUN_ONLY;
    return { iceServers: json.iceServers };
  } catch (err) {
    console.warn("[nirog] ICE fetch failed, falling back to STUN:", err);
    return STUN_ONLY;
  }
}

interface Signal {
  kind: "hello" | "offer" | "answer" | "ice" | "bye" | "state";
  from: CallRole;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  // "state" payload — presence the media stream cannot carry. Disabling a
  // video track sends BLACK FRAMES, not a mute event, so the far side cannot
  // tell "camera off" from "very dark room" unless we say so explicitly.
  micOn?: boolean;
  camOn?: boolean;
  name?: string;
}

/** What we know about the far peer beyond its media stream. */
export interface RemotePeerInfo {
  name?: string;
  micOn: boolean;
  camOn: boolean;
}

const REMOTE_DEFAULT: RemotePeerInfo = { micOn: true, camOn: true };

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
  opts?: { startWithVideo?: boolean; displayName?: string }
) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(opts?.startWithVideo ?? true);
  const [remoteInfo, setRemoteInfo] = useState<RemotePeerInfo>(REMOTE_DEFAULT);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const chanRef = useRef<RealtimeChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const statusRef = useRef<CallStatus>("idle");
  const startedRef = useRef(false);
  const camOnRef = useRef(camOn);
  const micOnRef = useRef(true);
  // Captured once — a caller's display name doesn't change mid-call, and
  // writing a ref during render violates the hooks contract.
  const nameRef = useRef(opts?.displayName);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  // Resolved once at start(); newPc() must stay synchronous because it is also
  // called mid-negotiation, when awaiting would race the incoming offer.
  const rtcConfigRef = useRef<RTCConfiguration>(STUN_ONLY);

  const setStatusBoth = (s: CallStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  const send = useCallback((payload: Signal) => {
    void chanRef.current?.send({ type: "broadcast", event: "signal", payload });
  }, []);

  /** Announce our name + mic/cam state to the far peer. */
  const sendState = useCallback(() => {
    send({
      kind: "state",
      from: role,
      micOn: micOnRef.current,
      camOn: camOnRef.current,
      name: nameRef.current,
    });
  }, [role, send]);

  const newPc = useCallback(() => {
    pcRef.current?.close();
    pendingIce.current = [];
    const pc = new RTCPeerConnection(rtcConfigRef.current);
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
          // The far peer (re)joined: introduce ourselves. Their copy of our
          // state died with their previous page, so always re-announce.
          sendState();
          if (role === "doctor") {
            // Re-offer unless we're already live with this peer.
            if (statusRef.current !== "connected") await makeOffer();
          } else if (statusRef.current === "waiting") {
            // Late-joining doctor announced — reply so they offer.
            send({ kind: "hello", from: role });
          }
        } else if (payload.kind === "state") {
          setRemoteInfo((prev) => ({
            name: payload.name ?? prev.name,
            micOn: payload.micOn ?? prev.micOn,
            camOn: payload.camOn ?? prev.camOn,
          }));
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
          setRemoteInfo(REMOTE_DEFAULT);
          pcRef.current?.close();
          pcRef.current = null;
          setStatusBoth(role === "doctor" ? "waiting" : "ended");
        }
      } catch (err) {
        console.warn("[call] signal error", err);
      }
    },
    [role, makeOffer, newPc, flushIce, send, sendState]
  );

  /** Ask for camera + mic and join the signaling room. Needs a user gesture. */
  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Get the relay credentials before any peer connection exists. Runs in
    // parallel with the permission prompt, so it costs no perceptible time.
    const configPromise = fetchRtcConfig();

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

    rtcConfigRef.current = await configPromise;
    setStatusBoth("waiting");

    supabaseRef.current ??= createClient();
    const chan = supabaseRef.current.channel(`call-${room}`, {
      config: { broadcast: { self: false } },
    });
    chan.on("broadcast", { event: "signal" }, ({ payload }) =>
      handleSignal(payload as Signal)
    );
    chan.subscribe((st) => {
      if (st === "SUBSCRIBED") {
        send({ kind: "hello", from: role });
        sendState();
      }
    });
    chanRef.current = chan;
  }, [room, role, handleSignal, send, sendState]);

  const toggleMic = useCallback(() => {
    setMicOn((on) => {
      micOnRef.current = !on;
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !on));
      return !on;
    });
    // Refs are already flipped by the updater above (React runs it before
    // returning), but announce on the next tick to be safe under StrictMode's
    // double-invoke.
    queueMicrotask(sendState);
  }, [sendState]);

  const toggleCam = useCallback(() => {
    setCamOn((on) => {
      camOnRef.current = !on;
      streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !on));
      return !on;
    });
    queueMicrotask(sendState);
  }, [sendState]);

  const teardown = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteInfo(REMOTE_DEFAULT);
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
    remote: remoteInfo,
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
