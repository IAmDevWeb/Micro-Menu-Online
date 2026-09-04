import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { roomName, type RealtimeEvent } from "@/lib/realtime";

let cached: SupabaseClient | null = null;

function createSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseServer(): SupabaseClient | null {
  if (!cached) cached = createSupabase();
  return cached;
}

async function broadcast(room: string, event: RealtimeEvent) {
  const supabase = getSupabaseServer();
  if (!supabase) return;

  const channel = supabase.channel(roomName(room));
  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") return resolve();
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        return reject(new Error(`realtime subscribe failed: ${status}`));
      }
    });
  });
  channel.send({ type: "broadcast", event: "message", payload: event });
  await supabase.removeChannel(channel);
}

export async function emitToKitchen(event: RealtimeEvent) {
  await broadcast("kitchen", event);
}

export async function emitToCashier(event: RealtimeEvent) {
  await broadcast("cashier", event);
}

export async function emitToStaff(event: RealtimeEvent) {
  await broadcast("kitchen", event);
  await broadcast("cashier", event);
}

export async function emitToTable(tableId: string, event: RealtimeEvent) {
  await broadcast(`table:${tableId}`, event);
}
