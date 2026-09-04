import { notFound } from "next/navigation";
import { getTableById } from "@/lib/data/public";
import { tableUrl } from "@/lib/data/qr";
import { QRCodeSVG } from "qrcode.react";

export const dynamic = "force-dynamic";

export default async function TablePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const table = await getTableById(id);
  if (!table) notFound();

  const url = tableUrl(table.id, table.qrToken);

  return (
    <div className="print-area flex flex-col items-center justify-center min-h-screen p-8 text-center print:min-h-screen">
      <div className="text-sm text-neutral-500 mb-2">ร้านอาหารของเรา</div>
      <h1 className="text-2xl font-bold mb-1">โต๊ะ {table.tableNumber}</h1>
      <div className="text-sm text-neutral-500 mb-4">สแกนเพื่อสั่งอาหาร</div>
      <div className="bg-white border-2 border-neutral-900 rounded-2xl p-6 inline-block">
        <QRCodeSVG value={url} size={280} />
      </div>
      <div className="mt-4 text-xs text-neutral-400 break-all max-w-sm">
        {url}
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          .print-area { min-height: 100vh; }
        }
      `}</style>
    </div>
  );
}
