import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { getSupabaseServer } from "@/lib/supabase/server";

const BUCKET = "product-images";
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const MAX_SIZE = 5 * 1024 * 1024;

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = await requireRole("admin");
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.error },
      { status: guard.error === "unauthorized" ? 401 : 403 }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }

  const type = file.type;
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: "ไฟล์ไม่ใช่รูปภาพที่รองรับ" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_SIZE) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 5MB" }, { status: 400 });
  }

  const ext = EXT[type] || "";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;

  const supabase = getSupabaseServer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(name, bytes, { contentType: type, upsert: false });
  if (error) {
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
