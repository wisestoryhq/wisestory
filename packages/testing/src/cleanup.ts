import type { PrismaClient } from "@wisestory/db";

/**
 * Truncate all application tables. Preserves schema/migrations.
 * Call between tests for isolation.
 */
export async function cleanupTestDb(prisma: PrismaClient): Promise<void> {
  // Order matters — delete children before parents
  await prisma.$executeRawUnsafe(`
    TRUNCATE
      knowledge_chunks,
      generation_source_refs,
      source_files,
      source_connections,
      briefing_edges,
      briefing_nodes,
      campaign_outputs,
      campaign_messages,
      campaigns,
      workspace_members,
      workspaces,
      sessions,
      accounts,
      verifications,
      users
    CASCADE
  `);
}
