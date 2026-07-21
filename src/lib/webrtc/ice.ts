/**
 * ICE server configuration — STUN discovery plus a TURN relay.
 *
 * Why this exists at all: STUN alone cannot connect two peers that are both
 * behind symmetric or carrier-grade NAT, which is the normal case on Indian
 * mobile networks. Without a TURN relay a large share of real consultations
 * simply never connect. TURN is not an optimisation here; it is the difference
 * between a call working and not.
 *
 * Why credentials are minted server-side: a TURN username/password shipped in
 * client JavaScript is public, and TURN egress is metered and billable. The
 * coturn REST scheme (RFC 7635 style, `use-auth-secret`) solves this — the
 * server derives a short-lived credential from a shared secret that never
 * leaves the server:
 *
 *     username   = <unix-expiry>:<opaque-user>
 *     credential = base64( HMAC-SHA1( secret, username ) )
 *
 * coturn recomputes the same HMAC to validate, so no per-user state is stored
 * anywhere and a leaked credential dies on its own within TTL_SECONDS.
 */
import { createHmac } from "node:crypto";

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface IceConfig {
  iceServers: IceServer[];
  /** Seconds until the TURN credential expires (absent when TURN is unset). */
  ttl?: number;
  /** Which provider path produced this config — surfaced by diagnostics. */
  provider: "hmac" | "static" | "none";
}

export const DEFAULT_STUN = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
];

/** Credential lifetime. Long enough for a consultation, short enough to matter. */
export const TTL_SECONDS = 60 * 60 * 4;

function urls(): string[] {
  return (process.env.TURN_URLS ?? process.env.NEXT_PUBLIC_TURN_URLS ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

/**
 * Build the ICE configuration for one caller.
 *
 * `identity` is stamped into the TURN username so relay usage is attributable
 * in coturn's logs — useful when a bill or an abuse report needs explaining.
 */
export function buildIceConfig(identity = "nirog"): IceConfig {
  const turnUrls = urls();
  const stun: IceServer = { urls: DEFAULT_STUN };

  if (turnUrls.length === 0) {
    return { iceServers: [stun], provider: "none" };
  }

  const secret = process.env.TURN_SECRET;
  if (secret) {
    const expiry = Math.floor(Date.now() / 1000) + TTL_SECONDS;
    // Colons delimit the coturn username, so they must not appear in identity.
    const username = `${expiry}:${identity.replace(/:/g, "_").slice(0, 64)}`;
    const credential = createHmac("sha1", secret)
      .update(username)
      .digest("base64");
    return {
      iceServers: [stun, { urls: turnUrls, username, credential }],
      ttl: TTL_SECONDS,
      provider: "hmac",
    };
  }

  // Long-lived credentials (metered.ca, Twilio, a fixed coturn user). Weaker,
  // but still far better than no relay at all.
  const username = process.env.TURN_USERNAME ?? process.env.NEXT_PUBLIC_TURN_USERNAME;
  const credential =
    process.env.TURN_CREDENTIAL ?? process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
  if (username && credential) {
    return {
      iceServers: [stun, { urls: turnUrls, username, credential }],
      provider: "static",
    };
  }

  // URLs set but no credentials — a misconfiguration. Fall back to STUN rather
  // than handing the browser a TURN server it can't authenticate against.
  return { iceServers: [stun], provider: "none" };
}

/** True when a usable relay is configured. Drives the diagnostics banner. */
export function turnConfigured(): boolean {
  return buildIceConfig().provider !== "none";
}
