import { NextResponse } from "next/server";
import { getMenu } from "@/lib/data/public";

export const dynamic = "force-dynamic";

export async function GET() {
  const menu = await getMenu();
  return NextResponse.json(menu);
}
