import { createDbClient, type PrismaClient } from "@wisestory/db";
import { execSync } from "child_process";
import path from "path";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://wisestory_test:wisestory_test@localhost:5435/wisestory_test";

let _prisma: PrismaClient | null = null;

export function getTestDb(): PrismaClient {
  if (!_prisma) {
    _prisma = createDbClient(TEST_DATABASE_URL);
  }
  return _prisma;
}

export function migrateTestDb(): void {
  const dbPkgDir = path.resolve(import.meta.dirname, "../../db");
  execSync(`npx prisma migrate deploy`, {
    cwd: dbPkgDir,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });
}

export async function disconnectTestDb(): Promise<void> {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}

export { TEST_DATABASE_URL };
