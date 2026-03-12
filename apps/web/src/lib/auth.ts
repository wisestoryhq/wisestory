import { createAuth } from "@wisestory/auth";
import { PrismaClient } from "@wisestory/db";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

export const auth = createAuth(prisma);
