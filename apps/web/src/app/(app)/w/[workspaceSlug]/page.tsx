import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { WorkspaceDashboard } from "./dashboard";

type Params = { workspaceSlug: string };

export default async function WorkspacePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
      _count: {
        select: {
          projects: true,
          sourceConnections: true,
        },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    notFound();
  }

  return (
    <WorkspaceDashboard
      workspace={{
        name: workspace.name,
        slug: workspace.slug,
        category: workspace.category,
        description: workspace.description,
        projectCount: workspace._count.projects,
        sourceCount: workspace._count.sourceConnections,
      }}
      user={{
        name: session.user.name,
        image: session.user.image ?? undefined,
        role: workspace.members[0].role,
      }}
    />
  );
}
