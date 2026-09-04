export function formatBaht(n: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(n);
}

export function formatBahtShort(n: number): string {
  return `${new Intl.NumberFormat("th-TH").format(Math.round(n))} บาท`;
}

export function parseTime(s: string): Date {
  return new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
}

export function formatTime(s: string): string {
  return parseTime(s).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(s: string): string {
  return parseTime(s).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
