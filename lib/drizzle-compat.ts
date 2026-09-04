export type CompatColumn = {
  name: string;
  table?: string;
  __model?: string;
};

export function makeTable(modelName: string, tableName: string, fields: Record<string, CompatColumn | string>) {
  const table = { __model: modelName, __table: tableName } as Record<string, CompatColumn | string>;
  for (const [key, value] of Object.entries(fields)) {
    table[key] = typeof value === "string" ? { name: value, table: tableName, __model: modelName } : value;
  }
  return table;
}

export function eq(column: CompatColumn | string, value: unknown) {
  return {
    type: "eq",
    field: typeof column === "string" ? column : column.name,
    value,
  };
}

export function and(...conditions: unknown[]) {
  return {
    type: "and",
    conditions: conditions.filter(Boolean),
  };
}

export function inArray(column: CompatColumn | string, values: unknown[]) {
  return {
    type: "inArray",
    field: typeof column === "string" ? column : column.name,
    values,
  };
}

export function asc(column: CompatColumn | string) {
  return {
    type: "order",
    field: typeof column === "string" ? column : column.name,
    direction: "asc",
  };
}

export function desc(column: CompatColumn | string) {
  return {
    type: "order",
    field: typeof column === "string" ? column : column.name,
    direction: "desc",
  };
}

export function sql(strings: TemplateStringsArray | string, ...values: unknown[]) {
  return {
    type: "sql",
    strings: Array.isArray(strings) ? strings : [strings],
    values,
  };
}

export const text = (name: string) => ({ name, __model: "" });
export const integer = (name: string) => ({ name, __model: "" });
export const boolean = (name: string) => ({ name, __model: "" });
export const doublePrecision = (name: string) => ({ name, __model: "" });
export const timestamp = (name: string) => ({ name, __model: "" });
export const index = () => undefined;
export const relations = () => undefined;
