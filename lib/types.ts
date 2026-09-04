export type OrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  price: number;
  qty: number;
  note: string | null;
  status: string;
};

export type Order = {
  id: string;
  tableId: string;
  tableNumber?: string;
  status: string;
  source: string;
  customerNote: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  createdByName?: string | null;
  items: OrderItem[];
};

export type Role = "admin" | "kitchen" | "cashier";
