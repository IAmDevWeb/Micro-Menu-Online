"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { roomName, type RealtimeEvent } from "@/lib/realtime";

let client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  if (!client) {
    client = createClient(url, key);
  }
  return client;
}

export type RealtimeHandler = (event: RealtimeEvent) => void;

export function subscribeRoom(room: string, handler: RealtimeHandler): () => void {
  const sb = getSupabaseBrowser();
  if (!sb) return () => {};

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
