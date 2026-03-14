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
 * Saves a user message to the campaign's message history.
 */
export async function saveUserMessage(campaignId: string, content: string) {
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

  return prisma.campaignMessage.create({
    data: {
      campaignId,
      role: "user",
      content,
    },
  });
}

/**
 * Saves an assistant message to the campaign's message history.
 */
export async function saveAssistantMessage(
  campaignId: string,
  content: string,
  images?: Array<{ data: string; mimeType: string }>
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  return prisma.campaignMessage.create({
    data: {
      campaignId,
      role: "assistant",
      content,
      images: images && images.length > 0 ? (images as unknown as import("@wisestory/db").Prisma.InputJsonValue) : undefined,
    },
  });
}

/**
 * Approves the briefing and transitions the campaign to "generating" status.
 */
export async function approveBriefing(
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
      status: "generating",
    },
  });
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
 * Generates a single production image via the agent service.
 */
export async function generateFinalImage(
  campaignId: string,
  imageSpec: {
    workspaceId: string;
    briefingSummary: string;
    imageDescription: string;
    mediaType: string;
    imageIndex: number;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  const agentUrl = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001";

  const response = await fetch(`${agentUrl}/generate/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(imageSpec),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Image generation failed");
  }

  const result = await response.json();
  return result as { image: { data: string; mimeType: string } };
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
