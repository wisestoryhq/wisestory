"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type CreateCampaignInput = {
  workspaceSlug: string;
  mediaType: string;
  prompt: string;
  instructions?: string;
};

/**
 * Creates a campaign record with "briefing" status and returns the id.
 * The user then enters the creative area for a multi-turn briefing chat.
 */
export async function createCampaign(input: CreateCampaignInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: input.workspaceSlug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    throw new Error("Workspace not found");
  }

  const campaign = await prisma.campaign.create({
    data: {
      mediaType: input.mediaType as never,
      prompt: input.prompt,
      instructions: input.instructions || null,
      status: "briefing",
      workspaceId: workspace.id,
    },
  });

  return { campaignId: campaign.id };
}

/**
 * Transitions campaign to "generating_doc" status to trigger briefing document generation.
 */
export async function generateBriefingDoc(
  campaignId: string,
  briefingSummary: string
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      status: "briefing",
      workspace: { members: { some: { userId: session.user.id } } },
    },
  });
  if (!campaign) throw new Error("Campaign not found or not in briefing phase");

  return prisma.campaign.update({
    where: { id: campaignId },
    data: {
      briefingSummary,
      status: "generating_doc",
    },
  });
}

/**
 * Marks a campaign as done generating. Called by the client after the
 * briefing SSE stream emits its "done" event, so the page can transition
 * to the completed view without a race condition.
 */
export async function completeBriefingGeneration(campaignId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      workspace: { members: { some: { userId: session.user.id } } },
    },
  });
  if (!campaign) throw new Error("Campaign not found");

  // Only transition if still generating — idempotent
  if (campaign.status === "generating_doc") {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "draft" },
    });
  }
}

/**
 * Loads the message history for a campaign.
 */
export async function getCampaignMessages(campaignId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      workspace: { members: { some: { userId: session.user.id } } },
    },
  });
  if (!campaign) throw new Error("Campaign not found");

  return prisma.campaignMessage.findMany({
    where: { campaignId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Resets a campaign back to the briefing chat phase so the user
 * can continue the conversation after viewing the generated document.
 */
export async function reopenBriefingChat(campaignId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      workspace: { members: { some: { userId: session.user.id } } },
    },
  });
  if (!campaign) throw new Error("Campaign not found");

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "briefing" },
  });
}

/**
 * Deletes a campaign and its outputs.
 */
export async function deleteCampaign(campaignId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      workspace: {
        members: { some: { userId: session.user.id } },
      },
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  await prisma.campaignOutput.deleteMany({
    where: { campaignId },
  });

  await prisma.campaign.delete({
    where: { id: campaignId },
  });
}
