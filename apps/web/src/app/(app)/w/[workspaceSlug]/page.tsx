import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { WorkspaceDashboard } from "./dashboard";

type Params = { workspaceSlug: string };

export default async function WorkspacePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { workspaceSlug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: {
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          projects: true,
          sourceConnections: true,
          campaigns: true,
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <WorkspaceDashboard
      workspace={{
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        projectCount: workspace._count.projects,
        sourceCount: workspace._count.sourceConnections,
        campaignCount: workspace._count.campaigns,
      }}
    />
  );
}
