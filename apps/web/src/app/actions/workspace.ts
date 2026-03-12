"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import slugify from "slugify";

export type CreateWorkspaceInput = {
  name: string;
  category: string;
  description?: string;
};

export async function createWorkspace(input: CreateWorkspaceInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Generate a URL-safe slug from the name
  let slug = slugify(input.name, { lower: true, strict: true });

  // Ensure uniqueness by appending a random suffix if taken
  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) {
    const suffix = Math.random().toString(36).substring(2, 6);
    slug = `${slug}-${suffix}`;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: input.name,
      slug,
      category: input.category as never,
      description: input.description || null,
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
  });

  redirect(`/w/${workspace.slug}`);
}

export async function getUserWorkspaces() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "desc" },
  });

  return memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }));
}
