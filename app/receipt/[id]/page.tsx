import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOrderWithItems } from "@/lib/data/orders";
import { formatBaht, formatTime, formatDate } from "@/lib/format";
import PrintButton from "@/components/print-button";

const METHOD_LABEL: Record<string, string> = { cash: "เงินสด", card: "บัตร", qr: "QR" };

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const order = await getOrderWithItems(id);
  if (!order) redirect("/staff/dashboard");

  const payment = await prisma.payment.findFirst({
    where: { orderId: id },
    include: { receivedBy: true },
  });

  const wasCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-neutral-100 flex items-start justify-center p-6 print:p-0 print:bg-white">
      <div className="w-full max-w-md">
        <div className="bg-white shadow rounded-2xl p-6 print:shadow-none print:rounded-none">
          <div className="text-center border-b pb-4 mb-4">
            <div className="text-sm font-semibold">ร้านอาหารของเรา</div>
            <div className="text-xs text-neutral-500">ใบเสร็จรับเงิน</div>
          </div>

          <div className="text-sm space-y-1 text-neutral-700">
            <div className="flex justify-between">
              <span>โต๊ะ</span>
              <span className="font-semibold">{order.table?.tableNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>วันที่</span>
              <span>{order.paidAt ? formatDate(order.paidAt) : formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>เวลา</span>
              <span>{order.paidAt ? formatTime(order.paidAt) : formatTime(order.createdAt)}</span>
            </div>
          </div>

          <div className="my-4 border-t border-dashed pt-4">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm py-1">
                <span>{it.productName} × {it.qty}</span>
                <span>{formatBaht(it.price * it.qty)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-lg font-bold">
              <span>รวมทั้งสิ้น</span>
              <span>{formatBaht(order.total)}</span>
            </div>
            <div className="flex justify-between text-sm text-neutral-600">
              <span>ชำระด้วย</span>
              <span>{METHOD_LABEL[payment?.method || "cash"] || payment?.method}</span>
            </div>
            {payment?.receivedBy && (
              <div className="flex justify-between text-sm text-neutral-500">
                <span>พนักงาน</span>
                <span>{payment.receivedBy.name}</span>
              </div>
            )}
          </div>

          {wasCancelled && (
            <div className="mt-4 rounded-lg bg-red-50 text-red-700 text-center py-2 font-semibold">
              คำสั่งซื้อนี้ถูกยกเลิก
            </div>
          )}

          <div className="text-center text-xs text-neutral-400 mt-6">
            ขอบคุณที่ใช้บริการค่ะ 🙏
          </div>
        </div>

        <div className="mt-4 flex gap-2 print:hidden">
          <PrintButton />
          <a
            href="/staff/dashboard"
            className="flex-1 rounded-lg border py-2.5 text-center font-semibold"
          >
            กลับ
          </a>
        </div>

        <style>{`
          @media print {
            body { background: white !important; }
            @page { margin: 12mm; }
          }
        `}</style>
      </div>
    </div>
  );
}
