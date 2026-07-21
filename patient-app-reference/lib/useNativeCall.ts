// Nirog patient app — the native (react-native-webrtc) twin of the doctor
// portal's src/lib/webrtc/use-call.ts. It speaks the IDENTICAL signaling
// protocol (hello / offer / answer / ice / bye over the Supabase broadcast
// channel `call-<room>`), so a patient on this hook and a doctor on the web
// hook connect to each other with no gateway in between. The patient is the
// ANSWERER; the doctor offers.
//
// ⚠️ react-native-webrtc has native code → this needs an EAS dev build (or
//    `expo prebuild`), NOT Expo Go. Add the config plugin:
//    npx expo install react-native-webrtc @config-plugins/react-native-webrtc
//    and put "@config-plugins/react-native-webrtc" in app.json > plugins.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  type MediaStream,
} from "react-native-webrtc";
import { supabase } from "./supabase";

export type CallStatus =
  | "idle"
  | "media-error"
  | "waiting"
  | "connecting"
  | "connected"
  | "ended";

// Relay credentials come from the portal's /api/ice endpoint — the SAME source
// the web side uses, so both peers always agree on the TURN server. Never
// hardcode TURN credentials in the app bundle: relay traffic is metered and
// billable, and anything shipped to a device is public.
//
//   EXPO_PUBLIC_PORTAL_URL=https://drconnect-nirog.vercel.app
const PORTAL_URL = (process.env.EXPO_PUBLIC_PORTAL_URL ?? "").replace(/\/$/, "");

const STUN_ONLY = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

/** Fetch ICE servers; degrade to STUN-only rather than failing the call. */
async function fetchRtcConfig() {
  if (!PORTAL_URL) return STUN_ONLY;
  try {
    const res = await fetch(`${PORTAL_URL}/api/ice`);
    if (!res.ok) throw new Error(`ice ${res.status}`);
    const json = await res.json();
    return json?.iceServers?.length ? { iceServers: json.iceServers } : STUN_ONLY;
  } catch (err) {
    console.warn("[nirog] ICE fetch failed, using STUN only:", err);
    return STUN_ONLY;
  }
}

interface Signal {
  kind: "hello" | "offer" | "answer" | "ice" | "bye";
  from: "doctor" | "patient";
  sdp?: unknown;
  candidate?: unknown;
}

export function useNativeCall(room: string) {
  const role = "patient" as const;
  const [status, setStatus] = useState<CallStatus>("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const chanRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const statusRef = useRef<CallStatus>("idle");
  const startedRef = useRef(false);
  const pendingIce = useRef<unknown[]>([]);
  // Resolved once in start(); newPc() stays synchronous because it also runs
  // mid-negotiation, where awaiting would race the incoming offer.
  const rtcConfigRef = useRef<any>(STUN_ONLY);

  const setBoth = (s: CallStatus) => { statusRef.current = s; setStatus(s); };
  const send = useCallback((p: Signal) => {
    void chanRef.current?.send({ type: "broadcast", event: "signal", payload: p });
  }, []);

  const newPc = useCallback(() => {
    pcRef.current?.close();
    pendingIce.current = [];
    const pc = new RTCPeerConnection(rtcConfigRef.current);
    streamRef.current?.getTracks().forEach((t) => pc.addTrack(t, streamRef.current!));
    // @ts-expect-error RN event typings
    pc.addEventListener("icecandidate", (e: any) => {
      if (e.candidate) send({ kind: "ice", from: role, candidate: e.candidate });
    });
    // @ts-expect-error RN event typings
    pc.addEventListener("track", (e: any) => {
      if (e.streams?.[0]) setRemoteStream(e.streams[0]);
    });
    // @ts-expect-error RN event typings
    pc.addEventListener("connectionstatechange", () => {
      const st = (pc as any).connectionState;
      if (st === "connected") setBoth("connected");
      else if (st === "failed" || st === "disconnected") {
        setRemoteStream(null);
        if (statusRef.current !== "ended") setBoth("waiting");
      }
    });
    pcRef.current = pc;
    return pc;
  }, [send]);

  const flushIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    for (const c of pendingIce.current.splice(0)) {
      await pc.addIceCandidate(new RTCIceCandidate(c as any)).catch(() => {});
    }
  }, []);

  const onSignal = useCallback(async (p: Signal) => {
    if (!p || p.from === role) return;
    try {
      if (p.kind === "hello") {
        // Doctor announced — nudge them to (re)offer if we're idle-waiting.
        if (statusRef.current === "waiting") send({ kind: "hello", from: role });
      } else if (p.kind === "offer" && p.sdp) {
        const pc = newPc();
        setBoth("connecting");
        await pc.setRemoteDescription(new RTCSessionDescription(p.sdp as any));
        await flushIce();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ kind: "answer", from: role, sdp: pc.localDescription });
      } else if (p.kind === "ice" && p.candidate) {
        const pc = pcRef.current;
        if (pc?.remoteDescription)
          await pc.addIceCandidate(new RTCIceCandidate(p.candidate as any)).catch(() => {});
        else pendingIce.current.push(p.candidate);
      } else if (p.kind === "bye") {
        setRemoteStream(null);
        pcRef.current?.close();
        pcRef.current = null;
        setBoth("ended");
      }
    } catch (err) {
      console.warn("[call] signal error", err);
    }
  }, [newPc, flushIce, send]);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Runs in parallel with the permission prompt, so it costs no extra time.
    const configPromise = fetchRtcConfig();

    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });
      streamRef.current = stream as unknown as MediaStream;
      setLocalStream(stream as unknown as MediaStream);
    } catch {
      startedRef.current = false;
      setBoth("media-error");
      return;
    }

    rtcConfigRef.current = await configPromise;
    setBoth("waiting");

    const chan = supabase.channel(`call-${room}`, {
      config: { broadcast: { self: false } },
    });
    chan.on("broadcast", { event: "signal" }, ({ payload }) => onSignal(payload as Signal));
    chan.subscribe((st) => {
      if (st === "SUBSCRIBED") send({ kind: "hello", from: role });
    });
    chanRef.current = chan;
  }, [room, onSignal, send]);

  const toggleMic = useCallback(() => {
    setMicOn((on) => {
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !on));
      return !on;
    });
  }, []);
  const toggleCam = useCallback(() => {
    setCamOn((on) => {
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
    if (chanRef.current) void supabase.removeChannel(chanRef.current);
    chanRef.current = null;
    startedRef.current = false;
  }, []);

  const end = useCallback(() => {
    send({ kind: "bye", from: role });
    teardown();
    setBoth("ended");
  }, [send, teardown]);

  useEffect(() => () => {
    if (startedRef.current) void chanRef.current?.send({
      type: "broadcast", event: "signal",
      payload: { kind: "bye", from: role } as Signal,
    });
    teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, micOn, camOn, localStream, remoteStream, start, toggleMic, toggleCam, end };
}
