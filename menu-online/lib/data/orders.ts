import { and, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

export async function getOrderWithItems(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      table: true,
      createdBy: true,
      items: true,
    },
  });
  return order;
}

export async function serializeOrder(order: NonNullable<Awaited<ReturnType<typeof getOrderWithItems>>>) {
  return {
    id: order.id,
    tableId: order.tableId,
    tableNumber: order.table?.tableNumber,
    status: order.status,
    source: order.source,
    customerNote: order.customerNote,
    total: order.total,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    paidAt: order.paidAt,
    cancelledAt: order.cancelledAt,
    createdByName: order.createdBy?.name ?? null,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      price: i.price,
      qty: i.qty,
      note: i.note,
      status: i.status,
    })),
  };
}

export async function listOrdersByTable(tableId: string) {
  const rows = await db.query.orders.findMany({
    where: and(
      eq(orders.tableId, tableId),
      eq(orders.status, "paid")
    ),
    orderBy: desc(orders.createdAt),
  });
  return rows;
}
