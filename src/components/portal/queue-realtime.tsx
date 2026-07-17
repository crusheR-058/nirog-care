"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Subscribes to live QueueEntry/AriaHandover changes over Supabase Realtime and
 * refreshes the server-rendered queue when anything changes. The payload is not
 * read — the RSC re-fetch runs through RLS, so only permitted data is shown.
 * Renders a small "live" indicator that flashes on each update.
 */
export function QueueRealtime() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | undefined;

    (async () => {
      // Realtime must carry the doctor's JWT, otherwise RLS filters out every
      // change and nothing is delivered.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) supabase.realtime.setAuth(session.access_token);

      // Unique per mount so React's double-invoke (dev) never reuses an
      // already-subscribed channel (which throws on further .on() calls).
      channel = supabase
        .channel(`nirog-queue-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "QueueEntry" },
          () => {
            setPulse(true);
            router.refresh();
            setTimeout(() => setPulse(false), 1200);
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "AriaHandover" },
          () => router.refresh()
        )
        .subscribe((status) => {
          setConnected(status === "SUBSCRIBED");
        });
    })();

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
        connected ? "bg-soft-green text-green" : "bg-secondary text-ink-faint"
      )}
      title={connected ? "Live — the queue updates in real time" : "Connecting…"}
    >
      <Radio className={cn("size-3", pulse && "animate-ping")} />
      {connected ? "Live" : "…"}
    </span>
  );
}
