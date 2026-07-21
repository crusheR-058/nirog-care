# TURN setup — making video calls actually connect

**Status: the code is ready; no TURN server is configured yet.**
Until one is, `/api/ice` returns `provider: "none"` and calls are STUN-only —
which means **they will fail for a large share of real patients.**

---

## Why this is not optional

STUN only tells each peer what its public address looks like. That is enough on
most home Wi-Fi, and it is why the call works when you test it from a laptop.

It is *not* enough behind **carrier-grade NAT (CGNAT)**, which is how Jio, Airtel
and Vi hand out mobile IPv4. Two phones on mobile data usually cannot find a
direct path at all. A TURN server fixes this by relaying the media — it is the
difference between a consultation connecting and silently failing.

Rural patients on mobile data are precisely the users this platform exists for,
so treat TURN as production infrastructure, not a nice-to-have.

---

## How credentials work here

TURN bandwidth is metered and billable, so a username/password shipped in the
client bundle is a standing invitation to use your relay for free. Nirog never
does that.

Instead `/api/ice` mints a **short-lived credential per caller** using coturn's
`use-auth-secret` scheme:

```
username   = <unix-expiry>:<user-id>
credential = base64( HMAC-SHA1( TURN_SECRET, username ) )
```

coturn recomputes the same HMAC to validate, so no per-user state is stored
anywhere, the shared secret never leaves the server, and a leaked credential
expires on its own (4 hours — [`src/lib/webrtc/ice.ts`](../src/lib/webrtc/ice.ts)).

Both clients fetch from the same endpoint, so the web portal and the Expo app
can never disagree about which relay to use.

---

## Option A — Metered.ca free tier (chosen)

No server to run. Free tier is ~50 GB/month with no card, which covers roughly
250 fully-relayed consultations.

1. Sign up at **metered.ca** → **TURN Server** in the dashboard.
2. Copy the **username**, **credential**, and your subdomain's TURN URLs.
3. Run the setup script — it proves the relay works *before* saving anything:

```bash
node scripts/setup-turn.mjs \
  --urls "turn:<subdomain>.relay.metered.ca:80,turn:<subdomain>.relay.metered.ca:443" \
  --username "<username>" \
  --credential "<credential>" \
  --write-env --push-vercel
```

`/api/ice` will then report `provider: "static"`.

> ⚠️ **Do not use the old "Open Relay" free public servers**
> (`openrelay.metered.ca` / `staticauth.openrelay.metered.ca`). That project has
> been retired — probing every endpoint returns `host` candidates only, never a
> `relay`. Anything still recommending it is out of date.

> The env keys have **no `NEXT_PUBLIC_` prefix** deliberately. These must stay
> server-side; anything `NEXT_PUBLIC_` is compiled into the browser bundle and
> is effectively public, and TURN egress is billable.

## Option B — self-hosted coturn (cheapest at scale, ephemeral credentials)

Needs a VM with a **public IPv4 address**. A relay behind NAT cannot relay, so a
home server or a NAT-ed cloud instance will not work. 1 vCPU / 1 GB is plenty;
size for bandwidth, not CPU — roughly 1.5 Mbit/s per relayed call leg.

```bash
# 1. DNS: point turn.nirog.health at the VM's public IP.

# 2. TLS (for turns:5349)
sudo certbot certonly --standalone -d turn.nirog.health

# 3. Configure and run
export TURN_REALM=turn.nirog.health
export TURN_SECRET="$(openssl rand -hex 32)"
export TURN_PUBLIC_IP=<the VM's public IPv4>
docker compose -f docker-compose.turn.yml up -d

# 4. Firewall: allow 3478/udp, 3478/tcp, 5349/tcp, 49160-49200/udp
```

Then on Vercel:

```
TURN_URLS=turn:turn.nirog.health:3478,turns:turn.nirog.health:5349
TURN_SECRET=<the same secret from step 3>
```

`/api/ice` will report `provider: "hmac"`.

Config lives in [`turnserver.conf`](../turnserver.conf). It denies every private
and reserved IP range — without that, a TURN server can be used to reach
internal services on your own network.

---

## The Expo app

The phone fetches the same endpoint. Set one variable:

```
EXPO_PUBLIC_PORTAL_URL=https://drconnect-nirog.vercel.app
```

Do **not** put TURN credentials in the app bundle — anything shipped to a device
is public. See [`patient-app-reference/lib/useNativeCall.ts`](../patient-app-reference/lib/useNativeCall.ts).

---

## Verifying it works

`scripts/setup-turn.mjs` does this for you and **refuses to write a config that
does not produce a relay candidate** — the dangerous state is not "unconfigured"
but "configured and silently not relaying".

Configuration being present is not proof the relay works. A URL can be set,
credentials can be wrong, and UDP 3478 can be closed — all three look identical
from the outside.

**In-app:** sign in as a clinician → **Settings → Call connectivity → Run test**.
It gathers real ICE candidates and counts them:

| Result | Meaning |
|---|---|
| `relay > 0` | ✅ TURN is genuinely reachable |
| `relay = 0`, provider `static`/`hmac` | ⚠️ configured but not answering — check credentials and that UDP 3478 is open |
| provider `none` | ❌ no TURN configured |

**From the command line:**

```bash
curl -s https://drconnect-nirog.vercel.app/api/ice | jq
```

**The strongest test:** force relay-only ICE in a scratch build
(`iceTransportPolicy: "relay"`). If a call still connects, TURN is doing real
work rather than being quietly bypassed by a direct path.

**The real-world test:** two phones on **mobile data, different carriers, Wi-Fi
off.** That is the case STUN cannot solve, and the one your patients are in.

---

## Cost

Relayed calls use roughly **1.5 Mbit/s per leg**, so a 10-minute video
consultation that goes through the relay costs about **200 MB**. Only calls that
cannot find a direct path get relayed — typically 15–25%. metered.ca's free
50 GB/month therefore covers on the order of 250 fully-relayed consultations.
