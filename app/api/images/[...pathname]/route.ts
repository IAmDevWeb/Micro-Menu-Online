import { type NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pathname: string[] }> }
) {
  const { pathname } = await params;
  const decoded = decodeURIComponent(pathname.join("/"));

  if (!decoded) {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
  }

  const result = await get(decoded, { access: "private" });
  if (result?.statusCode !== 200) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
