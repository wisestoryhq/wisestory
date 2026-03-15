import { beforeAll, beforeEach, afterAll } from "vitest";
import { getTestDb, migrateTestDb, disconnectTestDb, cleanupTestDb } from "@wisestory/testing";

export const prisma = getTestDb();

beforeAll(() => {
  migrateTestDb();
});

beforeEach(async () => {
  await cleanupTestDb(prisma);
});

afterAll(async () => {
  await cleanupTestDb(prisma);
  await disconnectTestDb();
});
