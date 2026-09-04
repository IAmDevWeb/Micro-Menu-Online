export function tableUrl(tableId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/menu/${tableId}?t=${token}`;
}

export function tableRedirectUrl(tableId: string, token: string): string {
  return `/menu/${tableId}?t=${token}`;
}
