import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products, tables, orders } from "@/lib/db/schema";

export async function verifyTableByToken(token: string) {
  const table = await db.query.tables.findFirst({
    where: eq(tables.qrToken, token),
  });
  return table ?? null;
}

export async function getTableById(tableId: string) {
  const table = await db.query.tables.findFirst({
    where: eq(tables.id, tableId),
  });
  return table ?? null;
}

export async function getMenu() {
  const cats = await db.query.categories.findMany({
    orderBy: asc(categories.sortOrder),
  });

  const productsByCat: Record<string, typeof products.$inferSelect[]> = {};
  const prods = await db
    .select()
    .from(products)
    .where(eq(products.active, true));

  for (const c of cats) {
    productsByCat[c.id] = prods.filter((p) => p.categoryId === c.id);
  }

  return {
    categories: cats.map((c) => ({
      id: c.id,
      name: c.name,
      products: productsByCat[c.id] || [],
    })),
  };
}

export async function getActiveOrdersForTable(tableId: string) {
  const rows = await db.query.orders.findMany({
    where: eq(orders.tableId, tableId),
    with: { items: true },
  });
  return rows.filter(
    (o) =>
      o.status === "pending" ||
      o.status === "preparing" ||
      o.status === "served"
  );
}
