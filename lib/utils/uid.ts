import { randomUUID } from "node:crypto";

export function uid(): string {
  return randomUUID();
}

export function generateQrToken(): string {
  return randomUUID().replace(/-/g, "").slice(0, 16);
}
