#!/usr/bin/env node
/**
 * Configure and PROVE a TURN relay.
 *
 * The dangerous state for TURN is not "unconfigured" — it's "configured but
 * silently not relaying". URLs can be set, credentials can be wrong, UDP 3478
 * can be firewalled, and from the outside all three look identical to a working
 * setup. Calls then fail only for users behind carrier-grade NAT, which is
 * exactly the population this platform exists for.
 *
 * So this script refuses to save anything until it has gathered a real `relay`
 * ICE candidate from a real browser using the exact credentials the app will
 * mint.
 *
 * Usage — self-hosted coturn (ephemeral HMAC credentials, recommended):
 *   node scripts/setup-turn.mjs \
 *     --urls "turn:turn.example.com:3478,turns:turn.example.com:5349" \
 *     --secret "<the coturn static-auth-secret>"
 *
 * Usage — managed provider (metered.ca, Twilio: long-lived credentials):
 *   node scripts/setup-turn.mjs \
 *     --urls "turn:a.relay.metered.ca:80" \
 *     --username "<user>" --credential "<pass>"
 *
 * Flags:
 *   --write-env    append/replace the keys in .env on success
 *   --push-vercel  set them on the Vercel project (production + preview)
 *   --dry-run      test only (default is test + report, no writes)
 */
import { createHmac } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => {
    if (!a.startsWith("--")) return [];
    const key = a.slice(2);
    const next = all[i + 1];
    return [[key, !next || next.startsWith("--") ? true : next]];
  })
);

const urls = String(args.urls ?? "").split(",").map((u) => u.trim()).filter(Boolean);
if (urls.length === 0) {
  console.error("Missing --urls. See the header of this file for usage.");
  process.exit(2);
}

const TTL = 60 * 60 * 4;
let username, credential, mode;

if (args.secret) {
  // Same derivation as src/lib/webrtc/ice.ts, so a pass here proves the app's
  // credentials will be accepted too.
  const expiry = Math.floor(Date.now() / 1000) + TTL;
  username = `${expiry}:nirog-setup-probe`;
  credential = createHmac("sha1", String(args.secret)).update(username).digest("base64");
  mode = "hmac";
} else if (args.username && args.credential) {
  username = String(args.username);
  credential = String(args.credential);
  mode = "static";
} else {
  console.error("Provide either --secret (coturn HMAC) or --username + --credential.");
  process.exit(2);
}

console.log(`Testing ${urls.length} URL(s) in ${mode} mode…`);
for (const u of urls) console.log(`  ${u}`);

// ── Prove it relays ─────────────────────────────────────────────────────────
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("\nplaywright is required to verify the relay: pnpm add -D playwright");
  process.exit(2);
}

const browser = await chromium.launch();
const page = await browser.newContext().then((c) => c.newPage());
await page.goto("about:blank");

const result = await page.evaluate(
  async ({ urls, username, credential }) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls, username, credential }],
      // Relay-only: if a candidate appears at all, it came through TURN. This
      // removes any chance of a direct path masking a broken relay.
      iceTransportPolicy: "relay",
    });
    pc.createDataChannel("probe");
    const found = [];
    const errors = [];
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 12000);
      pc.onicecandidate = (e) => {
        if (!e.candidate) { clearTimeout(timer); resolve(); return; }
        found.push({ type: e.candidate.type, protocol: e.candidate.protocol,
                     address: e.candidate.address });
      };
      pc.onicecandidateerror = (e) =>
        errors.push(`${e.errorCode} ${e.errorText ?? ""} (${e.url ?? ""})`.trim());
    });
    await pc.setLocalDescription(await pc.createOffer());
    pc.close();
    return { found, errors };
  },
  { urls, username, credential }
);
await browser.close();

const relays = result.found.filter((c) => c.type === "relay");
console.log("");
if (relays.length === 0) {
  console.error("FAILED — no relay candidate returned.\n");
  if (result.errors.length) {
    console.error("ICE errors:");
    for (const e of [...new Set(result.errors)]) console.error(`  ${e}`);
    console.error("");
  }
  console.error("Common causes:");
  console.error("  401 / 403  → wrong credentials, or the secret doesn't match coturn's");
  console.error("               static-auth-secret");
  console.error("  701 / none → UDP 3478 (and the relay range 49160-49200) is not open,");
  console.error("               or the host has no public IPv4");
  console.error("  timeout    → hostname resolves but nothing is listening");
  console.error("\nNothing was written. Fix the above and re-run.");
  process.exit(1);
}

console.log(`SUCCESS — ${relays.length} relay candidate(s):`);
for (const r of relays) console.log(`  ${r.protocol} via ${r.address}`);

// ── Persist only after proof ────────────────────────────────────────────────
const keys = mode === "hmac"
  ? { TURN_URLS: urls.join(","), TURN_SECRET: String(args.secret) }
  : { TURN_URLS: urls.join(","), TURN_USERNAME: username, TURN_CREDENTIAL: credential };

if (args["dry-run"]) {
  console.log("\n--dry-run: nothing written.");
  process.exit(0);
}

if (args["write-env"]) {
  const path = ".env";
  let body = existsSync(path) ? readFileSync(path, "utf8") : "";
  for (const [k, v] of Object.entries(keys)) {
    const line = `${k}="${v}"`;
    const re = new RegExp(`^${k}=.*$`, "m");
    body = re.test(body) ? body.replace(re, line) : `${body.trimEnd()}\n${line}\n`;
  }
  writeFileSync(path, body);
  console.log(`\nWrote ${Object.keys(keys).join(", ")} to .env`);
}

if (args["push-vercel"]) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    console.error("\n--push-vercel needs VERCEL_TOKEN in the environment.");
    process.exit(2);
  }
  const project = String(args.project ?? "drconnect-nirog");
  for (const [key, value] of Object.entries(keys)) {
    // Replace rather than duplicate: Vercel rejects a second env var with the
    // same key + target.
    const list = await fetch(`https://api.vercel.com/v9/projects/${project}/env`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    for (const e of (list.envs ?? []).filter((e) => e.key === key)) {
      await fetch(`https://api.vercel.com/v9/projects/${project}/env/${e.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
    }
    const res = await fetch(`https://api.vercel.com/v10/projects/${project}/env`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        key, value, type: "encrypted",
        target: ["production", "preview", "development"],
      }),
    });
    console.log(`  Vercel ${key}: ${res.ok ? "set" : `FAILED ${res.status}`}`);
  }
  console.log("\nRedeploy for the change to take effect (an empty commit is enough).");
}

console.log("\nVerify afterwards: Settings → Call connectivity → Run test.");
