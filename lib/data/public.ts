import { prisma } from "@/lib/db";

export async function verifyTableByToken(token: string) {
  return prisma.table.findFirst({
    where: { qrToken: token },
  });
}

export async function getTableById(tableId: string) {
  return prisma.table.findFirst({
    where: { id: tableId },
  });
}

export async function getMenu() {
  const cats = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const prods = await prisma.product.findMany({
    where: { active: true },
  });

  return {
    categories: cats.map((c) => ({
      id: c.id,
      name: c.name,
      products: prods.filter((p) => p.categoryId === c.id),
    })),
  };
}

export async function getActiveOrdersForTable(tableId: string) {
  const rows = await prisma.order.findMany({
    where: { tableId },
    include: { items: true },
  });
  return rows.filter(
    (o) =>
      o.status === "pending" ||
      o.status === "preparing" ||
      o.status === "served"
  );
}
