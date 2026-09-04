import { prisma } from "@/lib/db";

export async function getOrderWithItems(orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId },
    include: {
      table: true,
      createdBy: true,
      items: true,
    },
  });
}

export type OrderWithItems = NonNullable<Awaited<ReturnType<typeof getOrderWithItems>>>;

export async function serializeOrder(order: OrderWithItems) {
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
  return prisma.order.findMany({
    where: {
      tableId,
      status: "paid",
    },
    orderBy: { createdAt: "desc" },
  });
}
