import { describe, it, expect } from "vitest";
import { prisma } from "../setup";
import {
  createTestUser,
  createTestWorkspace,
  createTestCampaign,
  createTestMessage,
} from "@wisestory/testing";

describe("Campaign lifecycle", () => {
  it("creates campaign in briefing status", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const campaign = await createTestCampaign(prisma, ws.id);

    expect(campaign.status).toBe("briefing");
    expect(campaign.workspaceId).toBe(ws.id);
  });

  it("transitions to generating_doc", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const campaign = await createTestCampaign(prisma, ws.id, { status: "briefing" });

    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "generating_doc", briefingSummary: "Test summary" },
    });

    expect(updated.status).toBe("generating_doc");
    expect(updated.briefingSummary).toBe("Test summary");
  });

  it("transitions from generating_doc to draft (completeBriefingGeneration logic)", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const campaign = await createTestCampaign(prisma, ws.id, { status: "generating_doc" });

    // Only transition if still generating — idempotent
    if (campaign.status === "generating_doc") {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "draft" },
      });
    }

    const result = await prisma.campaign.findUnique({ where: { id: campaign.id } });
    expect(result?.status).toBe("draft");
  });

  it("reopens briefing chat from draft", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const campaign = await createTestCampaign(prisma, ws.id, { status: "draft" });

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "briefing" },
    });

    const result = await prisma.campaign.findUnique({ where: { id: campaign.id } });
    expect(result?.status).toBe("briefing");
  });

  it("deletes campaign and its outputs", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const campaign = await createTestCampaign(prisma, ws.id);
    await createTestMessage(prisma, campaign.id, { role: "user", content: "Hello" });
    await createTestMessage(prisma, campaign.id, { role: "assistant", content: "Hi" });

    await prisma.campaignOutput.deleteMany({ where: { campaignId: campaign.id } });
    await prisma.campaign.delete({ where: { id: campaign.id } });

    const result = await prisma.campaign.findUnique({ where: { id: campaign.id } });
    expect(result).toBeNull();

    // Messages should be cascade deleted
    const msgs = await prisma.campaignMessage.count({ where: { campaignId: campaign.id } });
    expect(msgs).toBe(0);
  });
});

describe("Campaign workspace scoping", () => {
  it("findFirst with workspace member check returns null for non-member", async () => {
    const userA = await createTestUser(prisma);
    const userB = await createTestUser(prisma);
    const wsA = await createTestWorkspace(prisma, userA.id);
    const campaign = await createTestCampaign(prisma, wsA.id);

    // User B tries to find the campaign
    const result = await prisma.campaign.findFirst({
      where: {
        id: campaign.id,
        workspace: { members: { some: { userId: userB.id } } },
      },
    });

    expect(result).toBeNull();
  });

  it("findFirst with workspace member check succeeds for member", async () => {
    const userA = await createTestUser(prisma);
    const wsA = await createTestWorkspace(prisma, userA.id);
    const campaign = await createTestCampaign(prisma, wsA.id);

    const result = await prisma.campaign.findFirst({
      where: {
        id: campaign.id,
        workspace: { members: { some: { userId: userA.id } } },
      },
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBe(campaign.id);
  });
});
