import { PrismaClient } from "@prisma/client";
import { schema } from "./schema";

const prismaGlobal = globalThis as typeof globalThis & {
  __menuOnlinePrisma?: PrismaClient;
};

export const prisma = prismaGlobal.__menuOnlinePrisma ?? new PrismaClient();
prismaGlobal.__menuOnlinePrisma = prisma;

const modelNames = {
  users: "user",
  categories: "category",
  products: "product",
  tables: "table",
  orders: "order",
  orderItems: "orderItem",
  payments: "payment",
} as const;

function prismaModel(name: keyof typeof modelNames) {
  const model = modelNames[name];
  return prisma[model as keyof typeof prisma] as any;
}

function getTableModel(table: any) {
  const name = table && table.__model ? table.__model : null;
  if (!name) throw new Error("Unsupported table for Prisma adapter");
  return name;
}

function normalizeSelect(select: Record<string, unknown> | undefined) {
  if (!select) return undefined;
  const next: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(select)) {
    next[key] = value && typeof value === "object" && "name" in (value as object) ? true : Boolean(value);
  }
  return next;
}

function normalizeInclude(include: Record<string, unknown> | undefined) {
  if (!include) return undefined;
  return Object.fromEntries(
    Object.entries(include).map(([key, value]) => {
      if (value === true) return [key, true];
      return [key, normalizeInclude(value as Record<string, unknown> | undefined)];
    })
  );
}

function normalizeOrder(order: unknown) {
  if (!order) return undefined;
  const entries = Array.isArray(order) ? order : [order];
  return entries.map((item: any) => {
    if (!item || item.type !== "order") return item;
    return { [item.field]: item.direction || "asc" };
  });
}

function normalizeWhere(where: any): any {
  if (!where) return undefined;
  if (where.type === "eq") return { [where.field]: where.value };
  if (where.type === "inArray") return { [where.field]: { in: where.values } };
  if (where.type === "and") return { AND: where.conditions.map(normalizeWhere).filter(Boolean) };
  if (where.type === "sql") return {};
  return where;
}

function tableNameFromField(field: any) {
  if (field && field.__model) return field.__model;
  if (field && field.__table) return field.__table;
  return null;
}

function runFindMany(table: any, query: any) {
  const modelName = getTableModel(table);
  const model = prismaModel(modelName as keyof typeof modelNames);
  const result = model.findMany({
    where: normalizeWhere(query.where),
    orderBy: normalizeOrder(query.orderBy)?.[0],
    include: normalizeInclude(query.include),
    select: normalizeSelect(query.select),
  });
  return result;
}

const builderPrototype = {
  from(table: any) {
    this.table = table;
    return this;
  },
  where(where: any) {
    this.whereClause = where;
    return this;
  },
  orderBy(...args: any[]) {
    this.orderByClause = args;
    return runFindMany(this.table, {
      where: this.whereClause,
      orderBy: this.orderByClause,
      select: this.selectClause,
    });
  },
};

const dblayer = {
  query: Object.fromEntries(
    Object.keys(modelNames).map((key) => {
      const modelName = key as keyof typeof modelNames;
      const model = prismaModel(modelName);
      return [
        key,
        {
          findFirst: async ({ where, with: include, orderBy }: any = {}) =>
            model.findFirst({
              where: normalizeWhere(where),
              include: normalizeInclude(include),
              orderBy: normalizeOrder(orderBy)?.[0],
            }),
          findMany: async ({ where, with: include, orderBy }: any = {}) =>
            model.findMany({
              where: normalizeWhere(where),
              include: normalizeInclude(include),
              orderBy: normalizeOrder(orderBy),
            }),
        },
      ];
    })
  ) as any,

  select(select?: Record<string, unknown>) {
    return {
      ...builderPrototype,
      table: null,
      whereClause: undefined,
      orderByClause: undefined,
      selectClause: select,
    };
  },

  insert(table: any) {
    const modelName = getTableModel(table);
    const model = prismaModel(modelName as keyof typeof modelNames);
    return {
      values(data: any) {
        const values = Array.isArray(data) ? data : [data];
        return {
          async returning() {
            if (values.length === 0) return [];
            if (values.length === 1) return [await model.create({ data: values[0] })];
            return model.createManyAndReturn({ data: values });
          },
        };
      },
    };
  },

  update(table: any) {
    const modelName = getTableModel(table);
    const model = prismaModel(modelName as keyof typeof modelNames);
    return {
      set(data: Record<string, unknown>) {
        return {
          where(where: any) {
            return {
              async returning() {
                const rows = await model.findMany({ where: normalizeWhere(where) });
                await model.updateMany({ where: normalizeWhere(where), data });
                return model.findMany({ where: normalizeWhere(where) });
              },
            };
          },
        };
      },
    };
  },

  delete(table: any) {
    const modelName = getTableModel(table);
    const model = prismaModel(modelName as keyof typeof modelNames);
    return {
      where(where: any) {
        return model.deleteMany({ where: normalizeWhere(where) });
      },
    };
  },
};

export const db = dblayer as any;
export { schema };
