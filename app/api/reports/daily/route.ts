import { NextResponse } from "next/server";
import { sql, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, orders, orderItems, tables } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/rbac";

export async function GET(request: Request) {
  const guard = await requireRole("cashier", "admin", "kitchen");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  // total revenue from payments on that day
  const revRow = (
    await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(sql`date(${payments.paidAt}) = ${date}`)
  )[0];

  // paid order count
  const orderCountRow = (
    await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(orders)
      .where(sql`${orders.status} = 'paid' AND date(${orders.paidAt}) = ${date}`)
  )[0];

  // by method
  const byMethod = await db
    .select({
      method: payments.method,
      total: sql<number>`SUM(${payments.amount})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(payments)
    .where(sql`date(${payments.paidAt}) = ${date}`)
    .groupBy(payments.method);

  // per table (paid orders)
  const perTable = await db
    .select({
      tableId: orders.tableId,
      tableNumber: tables.tableNumber,
      total: sql<number>`SUM(${orders.total})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .innerJoin(tables, eq(orders.tableId, tables.id))
    .where(sql`${orders.status} = 'paid' AND date(${orders.paidAt}) = ${date}`)
    .groupBy(orders.tableId, tables.tableNumber);

  // list of paid orders for detail
  const paidOrderRows = await db
    .select({
      id: orders.id,
      tableId: orders.tableId,
      tableNumber: tables.tableNumber,
      total: orders.total,
      paidAt: orders.paidAt,
    })
    .from(orders)
    .innerJoin(tables, eq(orders.tableId, tables.id))
    .where(sql`${orders.status} = 'paid' AND date(${orders.paidAt}) = ${date}`)
    .orderBy(desc(orders.paidAt));

  // top products from order items of paid orders that day
  const topProducts = await db
    .select({
      productName: orderItems.productName,
      qty: sql<number>`SUM(${orderItems.qty})`,
      revenue: sql<number>`SUM(${orderItems.price} * ${orderItems.qty})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(sql`${orders.status} = 'paid' AND date(${orders.paidAt}) = ${date}`)
    .groupBy(orderItems.productName)
    .orderBy(sql`SUM(${orderItems.qty}) DESC`);

  return NextResponse.json({
    date,
    totalRevenue: revRow?.total ?? 0,
    orderCount: orderCountRow?.n ?? 0,
    byMethod: byMethod.map((m) => ({
      method: m.method,
      total: m.total,
      count: m.count,
    })),
    perTable,
    orders: paidOrderRows,
    topProducts,
  });
}
