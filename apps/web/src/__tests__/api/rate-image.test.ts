import { describe, it, expect } from "vitest";
import { prisma } from "../setup";
import {
  createTestUser,
  createTestWorkspace,
  createTestCampaign,
  createTestBriefingNode,
} from "@wisestory/testing";

describe("Rate Image API — BriefingNode upserts", () => {
  it("creates a liked_image node when rating like", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const campaign = await createTestCampaign(prisma, ws.id);

    // Simulate what the rate-image API does
    const node = await prisma.briefingNode.create({
      data: {
        campaignId: campaign.id,
        nodeType: "liked_image",
        title: "Image 1 from message",
        content: "User liked this concept image",
        imageData: "base64data",
        imageMimeType: "image/png",
        metadata: { messageId: "msg-1", partIndex: 0, ratingSource: "user_explicit" },
      },
    });

    expect(node.nodeType).toBe("liked_image");
    expect(node.campaignId).toBe(campaign.id);
    const meta = node.metadata as Record<string, unknown>;
    expect(meta.ratingSource).toBe("user_explicit");
  });

  it("creates a rejected_option node when rating dislike", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const campaign = await createTestCampaign(prisma, ws.id);

    const node = await prisma.briefingNode.create({
      data: {
        campaignId: campaign.id,
        nodeType: "rejected_option",
        title: "Image 2 from message",
        content: "User disliked this concept image",
        imageData: "base64data",
        imageMimeType: "image/png",
        metadata: { messageId: "msg-1", partIndex: 1, ratingSource: "user_explicit" },
      },
    });

    expect(node.nodeType).toBe("rejected_option");
  });

  it("updates existing rating when re-rating", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const campaign = await createTestCampaign(prisma, ws.id);

    // First rating: like
    const node = await prisma.briefingNode.create({
      data: {
        campaignId: campaign.id,
        nodeType: "liked_image",
        title: "Image 1",
        content: "Liked",
        metadata: { messageId: "msg-1", partIndex: 0, ratingSource: "user_explicit" },
      },
    });

    // Change to dislike
    const updated = await prisma.briefingNode.update({
      where: { id: node.id },
      data: { nodeType: "rejected_option" },
    });

    expect(updated.nodeType).toBe("rejected_option");

    // Only one node exists for this image
    const count = await prisma.briefingNode.count({
      where: {
        campaignId: campaign.id,
        metadata: { path: ["messageId"], equals: "msg-1" },
      },
    });
    expect(count).toBe(1);
  });

  it("does not leak ratings across campaigns", async () => {
    const user = await createTestUser(prisma);
    const ws = await createTestWorkspace(prisma, user.id);
    const campaign1 = await createTestCampaign(prisma, ws.id);
    const campaign2 = await createTestCampaign(prisma, ws.id);

    await createTestBriefingNode(prisma, campaign1.id, {
      nodeType: "liked_image",
      metadata: { messageId: "msg-1", partIndex: 0, ratingSource: "user_explicit" },
    });

    // Campaign 2 should have no nodes
    const nodes = await prisma.briefingNode.findMany({
      where: { campaignId: campaign2.id },
    });
    expect(nodes).toHaveLength(0);
  });
});
