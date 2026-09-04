"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex-1 rounded-lg bg-neutral-900 text-white py-2.5 font-semibold"
    >
      🖨️ พิมพ์ใบเสร็จ
    </button>
  );
}
