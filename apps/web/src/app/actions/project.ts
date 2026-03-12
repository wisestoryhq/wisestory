"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type CreateProjectInput = {
  workspaceSlug: string;
  name: string;
  brief?: string;
  audience?: string;
  platforms: string[];
  notes?: string;
};

export async function createProject(input: CreateProjectInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Verify workspace membership
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

  const project = await prisma.project.create({
    data: {
      name: input.name,
      brief: input.brief || null,
      audience: input.audience || null,
      platforms: input.platforms as never,
      notes: input.notes || null,
      workspaceId: workspace.id,
    },
  });

  redirect(`/w/${input.workspaceSlug}/projects/${project.id}`);
}
