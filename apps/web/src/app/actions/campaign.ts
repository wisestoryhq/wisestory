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

export async function createAndGenerate(input: CreateCampaignInput) {
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

  // Verify project belongs to workspace
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, workspaceId: workspace.id },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Create campaign record
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

  // Call agent service to generate content
  const agentUrl = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001";

  try {
    const response = await fetch(`${agentUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: workspace.id,
        projectId: input.projectId,
        mediaType: input.mediaType,
        prompt: input.prompt,
        campaignId: campaign.id,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "failed" },
      });
      throw new Error(`Generation failed: ${error}`);
    }

    const result = await response.json();

    // Store the output
    if (result.parts?.length > 0) {
      await prisma.campaignOutput.create({
        data: {
          campaignId: campaign.id,
          parts: result.parts,
        },
      });
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "completed" },
    });

    return { campaignId: campaign.id };
  } catch (error) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "failed" },
    });
    throw error;
  }
}
