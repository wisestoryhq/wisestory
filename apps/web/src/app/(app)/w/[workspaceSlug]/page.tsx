import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
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

  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: {
      id: true,
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

  // Fetch recent campaigns with their project info
  const recentCampaigns = await prisma.campaign.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      mediaType: true,
      prompt: true,
      status: true,
      createdAt: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Fetch projects for quick create
  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <WorkspaceDashboard
      userName={session.user.name}
      workspace={{
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        projectCount: workspace._count.projects,
        sourceCount: workspace._count.sourceConnections,
        campaignCount: workspace._count.campaigns,
      }}
      recentCampaigns={recentCampaigns.map((c) => ({
        id: c.id,
        mediaType: c.mediaType,
        prompt: c.prompt,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        projectId: c.project.id,
        projectName: c.project.name,
      }))}
      projects={projects}
    />
  );
}
