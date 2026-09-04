import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">🍽️</div>
      <h1 className="text-3xl font-bold mb-2">ร้านอาหารของเรา</h1>
      <p className="text-neutral-600 mb-8 max-w-md">
        สแกน QR Code ที่โต๊ะ เพื่อเปิดเมนูและสั่งอาหารได้ทันที
        ระบบส่งคำสั่งถึงครัวและแคชเชียร์แบบเรียลไทม์
      </p>

      <div className="rounded-2xl bg-white border p-6 max-w-sm w-full mb-8">
        <div className="text-sm text-neutral-500">วิธีใช้งาน</div>
        <ol className="mt-3 text-left text-sm text-neutral-700 space-y-2">
          <li>1. เปิดกล้องสแกน QR Code ที่แปะบนโต๊ะ</li>
          <li>2. เลือกเมนูอาหารที่ต้องการ</li>
          <li>3. กดสั่งอาหาร — คำสั่งถึงครัวทันที</li>
          <li>4. เมื่อทานเสร็จ แจ้งพนักงานเก็บเงิน</li>
        </ol>
      </div>

      {session ? (
        <Link
          href="/staff/dashboard"
          className="rounded-full bg-neutral-900 text-white px-6 py-3 font-semibold"
        >
          ไปหน้า Dashboard พนักงาน
        </Link>
      ) : (
        <Link
          href="/login"
          className="rounded-full bg-neutral-900 text-white px-6 py-3 font-semibold"
        >
          เข้าสู่ระบบพนักงาน
        </Link>
      )}
    </div>
  );
}
