"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Radio, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Verdict = "pass" | "warn" | "fail";

interface Result {
  verdict: Verdict;
  provider: string;
  srflx: number;
  relay: number;
  detail: string;
}

/**
 * Prove the relay actually works, rather than trusting that env vars are set.
 *
 * Gathers ICE candidates against the live /api/ice config and counts what came
 * back. A `relay` candidate is the only evidence TURN is genuinely reachable —
 * URLs and credentials can be present and still be wrong.
 */
export function CallDiagnostics() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    let pc: RTCPeerConnection | undefined;
    try {
      const res = await fetch("/api/ice", { cache: "no-store" });
      const cfg = (await res.json()) as {
        iceServers: RTCIceServer[];
        provider: string;
      };

      pc = new RTCPeerConnection({ iceServers: cfg.iceServers });
      // A data channel is enough to trigger gathering without touching media.
      pc.createDataChannel("probe");

      let srflx = 0;
      let relay = 0;
      const done = new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 8000);
        pc!.onicecandidate = (e) => {
          if (!e.candidate) {
            clearTimeout(timer);
            resolve();
            return;
          }
          if (e.candidate.type === "srflx") srflx++;
          if (e.candidate.type === "relay") relay++;
        };
      });

      await pc.setLocalDescription(await pc.createOffer());
      await done;

      const verdict: Verdict =
        relay > 0 ? "pass" : cfg.provider === "none" ? "fail" : "warn";
      setResult({
        verdict,
        provider: cfg.provider,
        srflx,
        relay,
        detail:
          relay > 0
            ? "TURN relay reachable — calls will connect on carrier-grade NAT."
            : cfg.provider === "none"
              ? "No TURN server configured. Calls will fail for users on mobile data behind CGNAT."
              : "TURN is configured but returned no relay candidate — check the URL, credentials and that UDP 3478 is open.",
      });
    } catch (err) {
      setResult({
        verdict: "fail",
        provider: "unknown",
        srflx: 0,
        relay: 0,
        detail: `Probe failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      pc?.close();
      setRunning(false);
    }
  }

  const tone = {
    pass: { icon: CheckCircle2, cls: "text-green", bg: "bg-soft-green" },
    warn: { icon: AlertTriangle, cls: "text-amber", bg: "bg-soft-amber" },
    fail: { icon: XCircle, cls: "text-red", bg: "bg-soft-red" },
  } as const;

  return (
    <div className="rounded-2xl border border-hairline bg-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
            <Radio className="size-4 text-ink-faint" /> Call connectivity
          </h2>
          <p className="mt-1 max-w-md text-xs text-ink-soft">
            Checks that a TURN relay is reachable. Without one, consultations
            fail for patients on mobile data behind carrier-grade NAT.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={running}>
          {running && <Loader2 className="size-4 animate-spin" />}
          {running ? "Probing…" : "Run test"}
        </Button>
      </div>

      {result && (
        <div className={`mt-4 rounded-xl ${tone[result.verdict].bg} p-3.5`}>
          <p
            className={`flex items-center gap-2 text-sm font-semibold ${tone[result.verdict].cls}`}
          >
            {(() => {
              const Icon = tone[result.verdict].icon;
              return <Icon className="size-4" />;
            })()}
            {result.verdict === "pass"
              ? "Relay working"
              : result.verdict === "warn"
                ? "Relay not answering"
                : "No relay"}
          </p>
          <p className="mt-1.5 text-xs text-ink-soft">{result.detail}</p>
          <dl className="tnum mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-ink-faint">
            <span>
              provider <b className="text-ink-soft">{result.provider}</b>
            </span>
            <span>
              srflx <b className="text-ink-soft">{result.srflx}</b>
            </span>
            <span>
              relay <b className="text-ink-soft">{result.relay}</b>
            </span>
          </dl>
        </div>
      )}
    </div>
  );
}
