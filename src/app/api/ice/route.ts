import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildIceConfig } from "@/lib/webrtc/ice";

export const dynamic = "force-dynamic";

/**
 * Mint ICE servers (STUN + short-lived TURN credentials) for one caller.
 *
 * Deliberately reachable without a session: the patient joining from a plain
 * `/call/<room>` link has no Nirog account, and refusing them a relay would
 * break exactly the low-bandwidth rural case this platform exists for. The
 * room id is an unguessable cuid, credentials expire on their own, and TURN
 * relays opaque bytes — it grants no access to any Nirog data.
 *
 * When a session IS present we stamp the user id into the TURN username so
 * relay usage stays attributable in coturn's logs.
 */
export async function GET() {
  let identity = "guest";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) identity = user.id;
  } catch {
    // No session — fall through as a guest.
  }

  const config = buildIceConfig(identity);

  return NextResponse.json(config, {
    headers: {
      // Credentials are per-caller and time-boxed; never let a CDN share them.
      "Cache-Control": "private, no-store",
    },
  });
}
