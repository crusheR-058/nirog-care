// Nirog patient app — the in-call screen (React Native).
// Renders the doctor's video full-bleed with the patient's self-view as a
// picture-in-picture, plus mute / camera / end controls that flip the real
// tracks. Drop into your Expo router as e.g. app/call/[room].tsx.
import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { RTCView } from "react-native-webrtc";
import { useNativeCall } from "../lib/useNativeCall";

export default function CallScreen({ room }: { room: string }) {
  const call = useNativeCall(room);

  // Auto-join on mount (the patient arrived here because the doctor picked up).
  useEffect(() => {
    void call.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (call.status === "ended") {
    return (
      <View style={[styles.fill, styles.center]}>
        <Text style={styles.title}>Consultation ended</Text>
        <Text style={styles.sub}>
          Your care plan and prescriptions will appear in the app.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {/* doctor (remote) */}
      {call.remoteStream ? (
        <RTCView
          streamURL={(call.remoteStream as any).toURL()}
          objectFit="cover"
          style={styles.remote}
        />
      ) : (
        <View style={[styles.remote, styles.center]}>
          <Text style={styles.sub}>
            {call.status === "connecting"
              ? "Connecting to your doctor…"
              : "Waiting for your doctor…"}
          </Text>
        </View>
      )}

      {/* patient self-view (PiP) */}
      {call.localStream && call.camOn && (
        <RTCView
          streamURL={(call.localStream as any).toURL()}
          objectFit="cover"
          mirror
          style={styles.pip}
        />
      )}

      {/* controls */}
      <View style={styles.bar}>
        <Control on={call.micOn} onPress={call.toggleMic} label={call.micOn ? "Mute" : "Unmute"} />
        <Control on={call.camOn} onPress={call.toggleCam} label={call.camOn ? "Cam off" : "Cam on"} />
        <Pressable onPress={call.end} style={[styles.btn, styles.end]}>
          <Text style={styles.btnText}>End</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Control({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, on ? styles.btnOn : styles.btnOff]}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0c0c0e" },
  center: { alignItems: "center", justifyContent: "center" },
  remote: { ...StyleSheet.absoluteFillObject },
  pip: {
    position: "absolute",
    right: 16,
    top: 48,
    width: 104,
    height: 152,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#111",
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 32,
    paddingTop: 16,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  btn: { height: 48, paddingHorizontal: 22, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  btnOn: { backgroundColor: "rgba(255,255,255,0.14)" },
  btnOff: { backgroundColor: "#e5484d" },
  end: { backgroundColor: "#e5484d" },
  btnText: { color: "#fff", fontWeight: "600" },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  sub: { color: "rgba(255,255,255,0.65)", marginTop: 8, textAlign: "center", paddingHorizontal: 32 },
});
