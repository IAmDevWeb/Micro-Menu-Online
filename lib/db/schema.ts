import type { Prisma } from "@/generated/prisma/client";

export type Role = "admin" | "kitchen" | "cashier";
export type OrderStatus = "pending" | "preparing" | "served" | "paid" | "cancelled";
export type OrderSource = "self" | "staff";
export type ItemStatus = "pending" | "preparing" | "done";
export type PaymentMethod = "cash" | "card" | "qr";

export type User = Prisma.UserGetPayload<{}>;
export type Category = Prisma.CategoryGetPayload<{}>;
export type Product = Prisma.ProductGetPayload<{}>;
export type Table = Prisma.TableGetPayload<{}>;
export type Order = Prisma.OrderGetPayload<{}>;
export type OrderItem = Prisma.OrderItemGetPayload<{}>;
export type Payment = Prisma.PaymentGetPayload<{}>;
