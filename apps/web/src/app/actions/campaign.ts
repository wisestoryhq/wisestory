"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type CreateCampaignInput = {
  workspaceSlug: string;
  projectId: string;
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

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, workspaceId: workspace.id },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const campaign = await prisma.campaign.create({
    data: {
      mediaType: input.mediaType as never,
      prompt: input.prompt,
      instructions: input.instructions || null,
      status: "generating",
      workspaceId: workspace.id,
      projectId: input.projectId,
    },
  });

  return { campaignId: campaign.id };
}
