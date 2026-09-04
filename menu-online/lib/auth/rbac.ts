import "server-only";
import { eq } from "drizzle-orm";
import { getSession } from "./session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { Role } from "@/lib/db/schema";

export const ROLE_RANK: Record<Role, number> = {
  cashier: 1,
  kitchen: 1,
  admin: 3,
};

export async function requireRole(...roles: Role[]): Promise<{
  user: { id: string; name: string; email: string; role: Role };
  ok: boolean;
  error: string | null;
}> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "unauthorized", user: null as never };
  }
  if (roles.length > 0 && !roles.includes(session.role)) {
    return { ok: false, error: "forbidden", user: null as never };
  }
  const userRow = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  if (!userRow || !userRow.active) {
    return { ok: false, error: "unauthorized", user: null as never };
  }
  return {
    ok: true,
    error: null,
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
    },
  };
}
