import type { PrismaClient } from "@wisestory/db";

let counter = 0;
function uid() {
  return `test-${++counter}-${Date.now()}`;
}

/**
 * Create a test user directly in the database.
 */
export async function createTestUser(
  prisma: PrismaClient,
  overrides: { name?: string; email?: string } = {},
) {
  const id = uid();
  return prisma.user.create({
    data: {
      id,
      name: overrides.name ?? `Test User ${id}`,
      email: overrides.email ?? `${id}@test.wisestory.co`,
      emailVerified: true,
    },
  });
}

/**
 * Create a test workspace with an owner member.
 */
export async function createTestWorkspace(
  prisma: PrismaClient,
  ownerId: string,
  overrides: { name?: string; slug?: string; category?: string } = {},
) {
  const id = uid();
  const slug = overrides.slug ?? `ws-${id}`;
  return prisma.workspace.create({
    data: {
      name: overrides.name ?? `Workspace ${id}`,
      slug,
      category: (overrides.category as never) ?? "tech",
      members: {
        create: { userId: ownerId, role: "owner" },
      },
    },
    include: { members: true },
  });
}

/**
 * Add a member to a workspace.
 */
export async function addWorkspaceMember(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  role: "owner" | "admin" | "member" = "member",
) {
  return prisma.workspaceMember.create({
    data: { workspaceId, userId, role },
  });
}

/**
 * Create a test campaign in a workspace.
 */
export async function createTestCampaign(
  prisma: PrismaClient,
  workspaceId: string,
  overrides: { mediaType?: string; prompt?: string; status?: string } = {},
) {
  return prisma.campaign.create({
    data: {
      workspaceId,
      mediaType: overrides.mediaType ?? "instagram_post",
      prompt: overrides.prompt ?? "Test campaign prompt",
      status: (overrides.status as never) ?? "briefing",
    },
  });
}

/**
 * Create a test campaign message.
 */
export async function createTestMessage(
  prisma: PrismaClient,
  campaignId: string,
  overrides: { role?: string; content?: string } = {},
) {
  return prisma.campaignMessage.create({
    data: {
      campaignId,
      role: overrides.role ?? "assistant",
      content: overrides.content ?? "Test message content",
    },
  });
}

/**
 * Create a test briefing node.
 */
export async function createTestBriefingNode(
  prisma: PrismaClient,
  campaignId: string,
  overrides: {
    nodeType?: string;
    title?: string;
    content?: string;
    imageData?: string;
    imageMimeType?: string;
    metadata?: Record<string, unknown>;
  } = {},
) {
  return prisma.briefingNode.create({
    data: {
      campaignId,
      nodeType: overrides.nodeType ?? "concept",
      title: overrides.title ?? "Test Node",
      content: overrides.content ?? "Test node content",
      imageData: overrides.imageData,
      imageMimeType: overrides.imageMimeType,
      metadata: overrides.metadata,
    },
  });
}

/**
 * Create a test source connection (Google Drive).
 */
export async function createTestSourceConnection(
  prisma: PrismaClient,
  workspaceId: string,
  overrides: { folderIds?: string[]; folderNames?: string[]; status?: string } = {},
) {
  return prisma.sourceConnection.create({
    data: {
      workspaceId,
      provider: "google_drive",
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      status: (overrides.status as never) ?? "connected",
      folderIds: overrides.folderIds ?? [],
      folderNames: overrides.folderNames ?? [],
    },
  });
}

/**
 * Create a test source file.
 */
export async function createTestSourceFile(
  prisma: PrismaClient,
  workspaceId: string,
  connectionId: string,
  overrides: { name?: string; externalId?: string; status?: string } = {},
) {
  const id = uid();
  return prisma.sourceFile.create({
    data: {
      workspaceId,
      sourceConnectionId: connectionId,
      externalId: overrides.externalId ?? `ext-${id}`,
      name: overrides.name ?? `file-${id}.txt`,
      mimeType: "text/plain",
      status: (overrides.status as never) ?? "indexed",
    },
  });
}

/**
 * Create a test knowledge chunk.
 */
export async function createTestKnowledgeChunk(
  prisma: PrismaClient,
  workspaceId: string,
  sourceFileId: string,
  overrides: { content?: string; embedding?: number[] } = {},
) {
  return prisma.knowledgeChunk.create({
    data: {
      workspaceId,
      sourceFileId,
      content: overrides.content ?? "Test knowledge chunk content",
      embedding: overrides.embedding ?? Array(768).fill(0),
      chunkIndex: 0,
    },
  });
}

/** Reset the counter (call in beforeEach if needed) */
export function resetFixtureCounter() {
  counter = 0;
}
