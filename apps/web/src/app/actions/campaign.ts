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
 * Creates a campaign record with "generating" status and returns the id.
 * Generation is triggered client-side via the SSE stream endpoint.
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
      status: "generating",
      workspaceId: workspace.id,
    },
  });

  return { campaignId: campaign.id };
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
