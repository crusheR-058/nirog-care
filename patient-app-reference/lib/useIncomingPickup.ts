// Nirog patient app — watch a consult request for the doctor's pick-up.
// Subscribes to the patient's own QueueEntry row over Supabase Realtime; when a
// doctor claims it (state → in_consult, doctorId set) the patient is taken into
// the call. The call room id === queueId, so both sides already agree on it.
//
// Realtime MUST carry the patient JWT (setAuth) or RLS drops every event — the
// same rule the doctor portal's queue-realtime.tsx follows.
import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

type PickupState = "waiting" | "picked-up" | "ended";

export function useIncomingPickup(queueId: string | null) {
  const [state, setState] = useState<PickupState>("waiting");
  const chanRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!queueId) return;
    let active = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) supabase.realtime.setAuth(session.access_token);

      // In case the doctor picked up before we subscribed, poll once.
      const { data } = await supabase
        .from("QueueEntry")
        .select("state,doctorId")
        .eq("id", queueId)
        .maybeSingle();
      if (active && data?.state === "in_consult") setState("picked-up");
      if (active && (data?.state === "completed" || data?.state === "no_show"))
        setState("ended");

      const channel = supabase
        .channel(`pickup-${queueId}-${uid()}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "QueueEntry",
            filter: `id=eq.${queueId}`,
          },
          (payload) => {
            const row = payload.new as { state: string; doctorId: string | null };
            if (row.state === "in_consult" && row.doctorId) setState("picked-up");
            else if (row.state === "completed" || row.state === "no_show")
              setState("ended");
          }
        )
        .subscribe();
      chanRef.current = channel;
    })();

    return () => {
      active = false;
      if (chanRef.current) void supabase.removeChannel(chanRef.current);
    };
  }, [queueId]);

  return state;
}

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? String(Math.random()).slice(2);
