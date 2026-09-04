import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Configure it in .env");
  }
  const client = postgres(connectionString, { max: 1, prepare: false });
  return drizzle(client, { schema });
}

type Db = ReturnType<typeof createDb>;

let cached: Db | null = null;

const proxy = new Proxy({} as Db, {
  get(_target, prop) {
    if (!cached) cached = createDb();
    const value = Reflect.get(cached, prop, cached);
    return typeof value === "function" ? value.bind(cached) : value;
  },
});

export const db = proxy;
export { schema };
