import { makeTable } from "@/lib/drizzle-compat";

export type Role = "admin" | "kitchen" | "cashier";
export type OrderStatus = "pending" | "preparing" | "served" | "paid" | "cancelled";
export type OrderSource = "self" | "staff";
export type ItemStatus = "pending" | "preparing" | "done";
export type PaymentMethod = "cash" | "card" | "qr";

export const users = makeTable("user", "users", {
  id: "id",
  name: "name",
  email: "email",
  passwordHash: "passwordHash",
  role: "role",
  active: "active",
  createdAt: "createdAt",
});

export const categories = makeTable("category", "categories", {
  id: "id",
  name: "name",
  sortOrder: "sortOrder",
  createdAt: "createdAt",
});

export const products = makeTable("product", "products", {
  id: "id",
  categoryId: "categoryId",
  name: "name",
  description: "description",
  price: "price",
  imageUrl: "imageUrl",
  active: "active",
  createdAt: "createdAt",
});

export const tables = makeTable("table", "tables", {
  id: "id",
  tableNumber: "tableNumber",
  qrToken: "qrToken",
  createdAt: "createdAt",
});

export const orders = makeTable("order", "orders", {
  id: "id",
  tableId: "tableId",
  status: "status",
  source: "source",
  customerNote: "customerNote",
  createdById: "createdById",
  total: "total",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  paidAt: "paidAt",
  cancelledAt: "cancelledAt",
  cancelledById: "cancelledById",
});

export const orderItems = makeTable("orderItem", "order_items", {
  id: "id",
  orderId: "orderId",
  productId: "productId",
  productName: "productName",
  price: "price",
  qty: "qty",
  note: "note",
  status: "status",
});

export const payments = makeTable("payment", "payments", {
  id: "id",
  orderId: "orderId",
  amount: "amount",
  method: "method",
  receivedById: "receivedById",
  paidAt: "paidAt",
});

export const schema = {
  users,
  categories,
  products,
  tables,
  orders,
  orderItems,
  payments,
};
