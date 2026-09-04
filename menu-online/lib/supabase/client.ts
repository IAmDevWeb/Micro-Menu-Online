"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { roomName, type RealtimeEvent } from "@/lib/realtime";

let client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}

export type RealtimeHandler = (event: RealtimeEvent) => void;

export function subscribeRoom(room: string, handler: RealtimeHandler): () => void {
  const sb = getSupabaseBrowser();
  const channel = sb.channel(roomName(room));
  channel
    .on("broadcast", { event: "message" }, (payload) => {
      handler(payload.payload as unknown as RealtimeEvent);
    })
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}
