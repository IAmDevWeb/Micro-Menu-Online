import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireRole } from "@/lib/auth/rbac";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = await requireRole("admin");
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.error },
      { status: guard.error === "unauthorized" ? 401 : 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  if (!filename) {
    return NextResponse.json({ error: "ไม่พบชื่อไฟล์" }, { status: 400 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      { error: "ไฟล์ไม่ใช่รูปภาพที่รองรับ" },
      { status: 400 }
    );
  }

  if (!request.body) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }

  const name = `product-images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const blob = await put(name, request.body, {
      access: "public",
      addRandomSuffix: false,
    });
    return NextResponse.json(blob, { status: 201 });
  } catch (e) {
    console.error("[upload] put failed:", e);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }
}
