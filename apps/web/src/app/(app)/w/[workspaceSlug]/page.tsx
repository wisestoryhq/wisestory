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
          sourceConnections: true,
          campaigns: true,
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  const completedCampaignCount = await prisma.campaign.count({
    where: { workspaceId: workspace.id, status: "completed" },
  });

  // Fetch recent campaigns
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
    },
  });

  return (
    <WorkspaceDashboard
      userName={session.user.name}
      workspace={{
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        sourceCount: workspace._count.sourceConnections,
        campaignCount: workspace._count.campaigns,
        completedCampaignCount,
      }}
      recentCampaigns={recentCampaigns.map((c) => ({
        id: c.id,
        mediaType: c.mediaType,
        prompt: c.prompt,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
