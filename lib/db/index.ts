import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaGlobal = globalThis as typeof globalThis & {
  __menuOnlinePrisma?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma =
  prismaGlobal.__menuOnlinePrisma ??
  new PrismaClient({
    adapter,
  });
prismaGlobal.__menuOnlinePrisma = prisma;

export { prisma as db };
export * from "./schema";
