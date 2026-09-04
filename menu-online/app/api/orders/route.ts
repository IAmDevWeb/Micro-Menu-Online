import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, orderItems, products, tables } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { uid } from "@/lib/utils/uid";
import { getSession } from "@/lib/auth/session";
import {
  getOrderWithItems,
  serializeOrder,
} from "@/lib/data/orders";
import {
  emitToKitchen,
  emitToCashier,
  emitToTable,
} from "@/lib/supabase/server";

const OrderItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(99),
  note: z.string().max(200).optional().default(""),
});

const CreateOrderSchema = z.object({
  tableId: z.string().min(1),
  source: z.enum(["self", "staff"]),
  customerNote: z.string().max(500).optional().default(""),
  items: z.array(OrderItemSchema).min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableId = searchParams.get("tableId");
  if (!tableId) {
    return NextResponse.json({ error: "ต้องระบุ tableId" }, { status: 400 });
  }

  const rows = await db.query.orders.findMany({
    where: eq(orders.tableId, tableId),
    with: { items: true, table: true, createdBy: true },
  });
  const serialized = [];
  for (const row of rows) {
    serialized.push(await serializeOrder(row));
  }

  return NextResponse.json({ orders: serialized });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลคำสั่งซื้อไม่ถูกต้อง" },
      { status: 400 }
    );
  }
  const { tableId, source, customerNote, items } = parsed.data;

  const table = await db.query.tables.findFirst({
    where: eq(tables.id, tableId),
  });
  if (!table) {
    return NextResponse.json({ error: "ไม่พบโต๊ะ" }, { status: 404 });
  }

  let createdById: string | null = null;
  if (source === "staff") {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
    }
    createdById = session.userId;
  }

  const productIds = items.map((i) => i.productId);
  const allRows = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  let total = 0;
  type Resolved = {
    productId: string;
    productName: string;
    price: number;
    qty: number;
    note: string | null;
  };
  const resolvedItems: (Resolved | null)[] = items.map((it) => {
    const product = allRows.find((p) => p.id === it.productId);
    if (!product) return null;
    total += product.price * it.qty;
    return {
      productId: product.id,
      productName: product.name,
      price: product.price,
      qty: it.qty,
      note: it.note || null,
    };
  });

  if (resolvedItems.some((r) => r === null)) {
    return NextResponse.json({ error: "มีเมนูที่ไม่พบในระบบ" }, { status: 400 });
  }

  const orderId = uid();
  const order = (
    await db
      .insert(orders)
      .values({
        id: orderId,
        tableId,
        status: "pending",
        source,
        customerNote: customerNote || null,
        createdById,
        total,
      })
      .returning()
  )[0];

  await db.insert(orderItems).values(
    (resolvedItems as Resolved[]).map((r) => ({
      id: uid(),
      orderId,
      ...r,
      status: "pending" as const,
    }))
  );

  const full = await getOrderWithItems(order.id);
  const serialized = await serializeOrder(full!);

  await emitToKitchen({ type: "NEW_ORDER", order: serialized });
  await emitToCashier({ type: "ORDER_STATUS", orderId: order.id, status: "pending" });
  await emitToTable(tableId, { type: "NEW_ORDER", order: serialized });

  return NextResponse.json({ order: serialized }, { status: 201 });
}
