import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

export function createDbClient(connectionString?: string) {
  const url = connectionString ?? process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export function getDb(connectionString?: string) {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createDbClient(connectionString);
  }
  return globalForPrisma.prisma;
}
