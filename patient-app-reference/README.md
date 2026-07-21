# Nirog patient app ↔ doctor portal — integration reference

Drop-in reference code for wiring your **Expo patient app** to the **same
Supabase backend** as this doctor portal, so a patient can request an
on-demand consult and a doctor "picks up" a live video call.

> These files are **reference** for your Expo repo — they are excluded from
> this Next.js project's build (`tsconfig.json` + `.vercelignore`). Copy them
> into the Expo app and adjust import paths.

> 📄 **For the video call specifically, read
> [`docs/webrtc-supabase-handover.md`](../docs/webrtc-supabase-handover.md)** —
> the normative signalling contract (channel, message schema, roles, ICE/TURN)
> that lets the phone join the same call as the already-deployed web portal.

## The model (already live on the backend)

```
Patient app                         Doctor portal (this repo, deployed)
  requestConsult()                    IncomingDock (on-call toggle)
  → INSERT AriaHandover + QueueEntry   → getPoolQueue() shows it live + chime
    (doctorId = null, state=waiting)   → doctor taps Accept
  useIncomingPickup(queueId)          → claimQueueItem() (atomic)
  → sees state→in_consult ─────────── both open room  call-<queueId>
  useNativeCall(queueId)  ◄── WebRTC signaling over Supabase broadcast ──►  use-call.ts
```

The backend pieces this relies on are **already applied** to the shared
Supabase project (`nirog-care`): patient RLS + `current_account_id()` +
`ensure_account()` (`supabase/patient-access.sql`), the `doctorId`-nullable
pool + atomic-claim policies, and the realtime publication
(`supabase/realtime.sql`).

## Setup

1. **Install deps** (needs a native build — not Expo Go):
   ```bash
   npx expo install @supabase/supabase-js @react-native-async-storage/async-storage \
     react-native-url-polyfill react-native-webrtc @config-plugins/react-native-webrtc \
     expo-notifications expo-device
   ```
2. **app.json** → add the WebRTC config plugin and camera/mic permissions:
   ```json
   { "expo": { "plugins": ["@config-plugins/react-native-webrtc"] } }
   ```
3. **Env** (`.env` / EAS secrets) — the SAME values as the portal:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://vjiklmgyaqqnvwpiqhow.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   EXPO_PUBLIC_TURN_URLS=turn:your-turn-host:3478      # same TURN as the portal
   EXPO_PUBLIC_TURN_USERNAME=<user>
   EXPO_PUBLIC_TURN_CREDENTIAL=<cred>
   ```
4. **Build** a dev client (react-native-webrtc has native code):
   ```bash
   npx expo prebuild && npx eas build --profile development --platform android
   ```

## Files

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client (AsyncStorage session) — same project as the portal. |
| `lib/auth.ts` | Phone-OTP sign-in; `ensure_account()` links the auth user → Account. |
| `lib/enqueue.ts` | `requestConsult()` — writes the ARIA handover + pool QueueEntry. |
| `lib/useIncomingPickup.ts` | Subscribe to your request; fires when a doctor claims it. |
| `lib/useNativeCall.ts` | react-native-webrtc call hook — **same signaling as `use-call.ts`**. |
| `screens/CallScreen.tsx` | The in-call UI (remote full-screen, self-view PiP, mute/cam/end). |
| `lib/push.ts` | Register the Expo push token on the Account for pick-up alerts. |

## The flow, in code

```tsx
// 1. After ARIA intake:
const queueId = await requestConsult(patientId, ariaResult, "video");

// 2. Wait for a doctor to pick up:
const pickup = useIncomingPickup(queueId);
useEffect(() => {
  if (pickup === "picked-up") router.push(`/call/${queueId}`);
}, [pickup]);

// 3. On the call screen, the room IS the queueId:
<CallScreen room={queueId} />
```

## Still to do server-side (small)

- **Enable the Phone provider** in Supabase Auth + an SMS gateway (MSG91 /
  Twilio) — required for `sendOtp`/`verifyOtp`.
- **Stand up a TURN server** (metered.ca free tier, or self-hosted coturn) and
  set `EXPO_PUBLIC_TURN_*` here + `NEXT_PUBLIC_TURN_*` on the portal (Vercel).
- **Pick-up push** — a Supabase Edge Function on `QueueEntry` UPDATE
  (state→in_consult) that POSTs the Expo push (see `lib/push.ts`).
- **Harden** the call channel — restrict `call-<room>` broadcast to the
  assigned patient + doctor (Realtime authorization) before production.
