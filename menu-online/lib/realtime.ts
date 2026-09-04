export type RealtimeEvent =
  | { type: "NEW_ORDER"; order: unknown }
  | { type: "ORDER_STATUS"; orderId: string; status: string }
  | { type: "ORDER_CANCELLED"; orderId: string; tableId: string }
  | { type: "ORDER_PAID"; orderId: string; tableId: string; amount: number };

export function roomName(room: string): string {
  return `room:${room}`;
}
