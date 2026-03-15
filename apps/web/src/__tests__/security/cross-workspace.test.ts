import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../setup";
import {
  createTestUser,
  createTestWorkspace,
  createTestCampaign,
  createTestMessage,
  createTestBriefingNode,
  createTestSourceConnection,
  createTestSourceFile,
  createTestKnowledgeChunk,
} from "@wisestory/testing";

/**
 * Cross-workspace security tests.
 *
 * Setup: Two users, two workspaces. User A owns Workspace A, User B owns Workspace B.
 * Every test verifies that User B cannot access Workspace A's data.
 *
 * These tests replicate the exact Prisma queries used in API routes and server actions
 * to ensure the workspace membership check prevents cross-tenant access.
 */

let userA: { id: string };
let userB: { id: string };
let wsA: { id: string; slug: string };
let wsB: { id: string; slug: string };
let campaignA: { id: string };
let campaignB: { id: string };

beforeEach(async () => {
  userA = await createTestUser(prisma, { name: "User A", email: "a@test.co" });
  userB = await createTestUser(prisma, { name: "User B", email: "b@test.co" });
  wsA = await createTestWorkspace(prisma, userA.id, { slug: "workspace-a" });
  wsB = await createTestWorkspace(prisma, userB.id, { slug: "workspace-b" });
  campaignA = await createTestCampaign(prisma, wsA.id, { prompt: "Campaign A" });
  campaignB = await createTestCampaign(prisma, wsB.id, { prompt: "Campaign B" });
});

describe("Cross-workspace: Campaign access", () => {
  it("User B cannot access User A's campaign", async () => {
    const result = await prisma.campaign.findFirst({
      where: {
        id: campaignA.id,
        workspace: { members: { some: { userId: userB.id } } },
      },
    });
    expect(result).toBeNull();
  });

  it("User A can access their own campaign", async () => {
    const result = await prisma.campaign.findFirst({
      where: {
        id: campaignA.id,
        workspace: { members: { some: { userId: userA.id } } },
      },
    });
    expect(result).not.toBeNull();
  });

  it("User B cannot list User A's campaigns", async () => {
    const campaigns = await prisma.campaign.findMany({
      where: {
        workspace: { members: { some: { userId: userB.id } } },
      },
    });
    const ids = campaigns.map((c) => c.id);
    expect(ids).not.toContain(campaignA.id);
    expect(ids).toContain(campaignB.id);
  });
});

describe("Cross-workspace: Briefing graph access", () => {
  it("User B cannot read User A's briefing nodes", async () => {
    await createTestBriefingNode(prisma, campaignA.id, { title: "Secret Node" });

    // The graph API checks campaign ownership first
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignA.id,
        workspace: { members: { some: { userId: userB.id } } },
      },
    });
    expect(campaign).toBeNull();
    // If campaign is null, API returns 404 — nodes never queried
  });

  it("User A can read their own briefing nodes", async () => {
    const node = await createTestBriefingNode(prisma, campaignA.id, { title: "My Node" });

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignA.id,
        workspace: { members: { some: { userId: userA.id } } },
      },
    });
    expect(campaign).not.toBeNull();

    const nodes = await prisma.briefingNode.findMany({
      where: { campaignId: campaignA.id },
    });
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe(node.id);
  });
});

describe("Cross-workspace: Image rating access", () => {
  it("User B cannot rate images in User A's campaign", async () => {
    // Rate image API first checks campaign ownership
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignA.id,
        workspace: { members: { some: { userId: userB.id } } },
      },
    });
    expect(campaign).toBeNull();
  });

  it("User B cannot read User A's image ratings", async () => {
    await createTestBriefingNode(prisma, campaignA.id, {
      nodeType: "liked_image",
      metadata: { messageId: "msg-1", partIndex: 0, ratingSource: "user_explicit" },
    });

    // GET rate-image checks campaign ownership
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignA.id,
        workspace: { members: { some: { userId: userB.id } } },
      },
    });
    expect(campaign).toBeNull();
  });
});

describe("Cross-workspace: Workspace settings", () => {
  it("User B cannot update User A's workspace", async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: wsA.slug },
      include: { members: { where: { userId: userB.id } } },
    });

    // workspace exists but members is empty for User B
    expect(workspace).not.toBeNull();
    expect(workspace!.members).toHaveLength(0);
  });

  it("User A can update their own workspace", async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: wsA.slug },
      include: { members: { where: { userId: userA.id } } },
    });

    expect(workspace!.members).toHaveLength(1);
    expect(workspace!.members[0].role).toBe("owner");
  });
});

describe("Cross-workspace: Source connections", () => {
  it("User B cannot access User A's Drive connection", async () => {
    await createTestSourceConnection(prisma, wsA.id);

    const workspace = await prisma.workspace.findUnique({
      where: { slug: wsA.slug },
      include: {
        members: { where: { userId: userB.id } },
        sourceConnections: { where: { provider: "google_drive" } },
      },
    });

    // Workspace found but User B is not a member
    expect(workspace!.members).toHaveLength(0);
  });

  it("User B cannot disconnect User A's Drive", async () => {
    const conn = await createTestSourceConnection(prisma, wsA.id);

    // Disconnect API checks workspace membership
    const workspace = await prisma.workspace.findUnique({
      where: { slug: wsA.slug },
      include: {
        members: { where: { userId: userB.id } },
        sourceConnections: { where: { provider: "google_drive" } },
      },
    });

    expect(workspace!.members).toHaveLength(0);
    // API would return 404 here — connection survives
    const stillExists = await prisma.sourceConnection.findUnique({ where: { id: conn.id } });
    expect(stillExists).not.toBeNull();
  });
});

describe("Cross-workspace: Knowledge chunks isolation", () => {
  it("knowledge chunks from Workspace A are not visible to Workspace B queries", async () => {
    const connA = await createTestSourceConnection(prisma, wsA.id);
    const fileA = await createTestSourceFile(prisma, wsA.id, connA.id);
    await createTestKnowledgeChunk(prisma, wsA.id, fileA.id, {
      content: "Secret brand guide for Workspace A",
    });

    // Query scoped to Workspace B
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { workspaceId: wsB.id },
    });
    expect(chunks).toHaveLength(0);
  });

  it("knowledge chunks from Workspace A exist when queried by Workspace A", async () => {
    const connA = await createTestSourceConnection(prisma, wsA.id);
    const fileA = await createTestSourceFile(prisma, wsA.id, connA.id);
    await createTestKnowledgeChunk(prisma, wsA.id, fileA.id, {
      content: "Brand guide for Workspace A",
    });

    const chunks = await prisma.knowledgeChunk.findMany({
      where: { workspaceId: wsA.id },
    });
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe("Brand guide for Workspace A");
  });
});

describe("Cross-workspace: Campaign messages isolation", () => {
  it("messages from Workspace A campaign are not leaked", async () => {
    await createTestMessage(prisma, campaignA.id, { role: "user", content: "Secret prompt" });
    await createTestMessage(prisma, campaignA.id, { role: "assistant", content: "Secret response" });

    // Campaign B should have no messages
    const msgs = await prisma.campaignMessage.findMany({
      where: { campaignId: campaignB.id },
    });
    expect(msgs).toHaveLength(0);

    // User B cannot access Campaign A's messages (campaign check fails)
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignA.id,
        workspace: { members: { some: { userId: userB.id } } },
      },
    });
    expect(campaign).toBeNull();
  });
});
