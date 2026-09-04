import {
  pgTable,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const nowTs = { mode: "string" as const, withTimezone: true as const };

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "kitchen", "cashier"] })
    .notNull()
    .default("cashier"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", nowTs).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", nowTs).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    price: doublePrecision("price").notNull(),
    imageUrl: text("image_url"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", nowTs).notNull().defaultNow(),
  },
  (t) => [index("products_category_idx").on(t.categoryId)]
);

export const tables = pgTable("tables", {
  id: text("id").primaryKey(),
  tableNumber: text("table_number").notNull().unique(),
  qrToken: text("qr_token").notNull().unique(),
  createdAt: timestamp("created_at", nowTs).notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    tableId: text("table_id")
      .notNull()
      .references(() => tables.id),
    status: text("status", {
      enum: ["pending", "preparing", "served", "paid", "cancelled"],
    })
      .notNull()
      .default("pending"),
    source: text("source", { enum: ["self", "staff"] }).notNull().default("self"),
    customerNote: text("customer_note"),
    createdById: text("created_by_id").references(() => users.id),
    total: doublePrecision("total").notNull().default(0),
    createdAt: timestamp("created_at", nowTs).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", nowTs).notNull().defaultNow(),
    paidAt: timestamp("paid_at", nowTs),
    cancelledAt: timestamp("cancelled_at", nowTs),
    cancelledById: text("cancelled_by_id").references(() => users.id),
  },
  (t) => [index("orders_table_idx").on(t.tableId), index("orders_status_idx").on(t.status)]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id),
    productName: text("product_name").notNull(),
    price: doublePrecision("price").notNull(),
    qty: integer("qty").notNull().default(1),
    note: text("note"),
    status: text("status", { enum: ["pending", "preparing", "done"] })
      .notNull()
      .default("pending"),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)]
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    amount: doublePrecision("amount").notNull(),
    method: text("method", { enum: ["cash", "card", "qr"] }).notNull().default("cash"),
    receivedById: text("received_by_id").references(() => users.id),
    paidAt: timestamp("paid_at", nowTs).notNull().defaultNow(),
  },
  (t) => [index("payments_order_idx").on(t.orderId), index("payments_paidat_idx").on(t.paidAt)]
);

export type Role = "admin" | "kitchen" | "cashier";
export type OrderStatus = "pending" | "preparing" | "served" | "paid" | "cancelled";
export type OrderSource = "self" | "staff";
export type ItemStatus = "pending" | "preparing" | "done";
export type PaymentMethod = "cash" | "card" | "qr";

export const tablesRelations = relations(tables, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const usersRelations = relations(users, ({ many }) => ({
  ordersCreated: many(orders, { relationName: "createdBy" }),
  ordersCancelled: many(orders, { relationName: "cancelledBy" }),
  payments: many(payments),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
  createdBy: one(users, {
    relationName: "createdBy",
    fields: [orders.createdById],
    references: [users.id],
  }),
  cancelledBy: one(users, {
    relationName: "cancelledBy",
    fields: [orders.cancelledById],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  receivedBy: one(users, {
    fields: [payments.receivedById],
    references: [users.id],
  }),
}));
