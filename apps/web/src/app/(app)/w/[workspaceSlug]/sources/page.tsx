import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SourcesView } from "./sources-view";

type Params = { workspaceSlug: string };

export default async function SourcesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { workspaceSlug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: {
      id: true,
      slug: true,
      sourceConnections: {
        where: { provider: "google_drive" },
        take: 1,
        select: {
          id: true,
          status: true,
          folderIds: true,
          folderNames: true,
          createdAt: true,
          _count: {
            select: { sourceFiles: true },
          },
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  const connection = workspace.sourceConnections[0] ?? null;

  const campaignCount = await prisma.campaign.count({
    where: { workspaceId: workspace.id },
  });

  return (
    <SourcesView
      workspaceSlug={workspace.slug}
      googleClientId={process.env.GOOGLE_CLIENT_ID!}
      campaignCount={campaignCount}
      connection={
        connection
          ? {
              id: connection.id,
              status: connection.status,
              folderIds: connection.folderIds,
              folderNames: connection.folderNames,
              fileCount: connection._count.sourceFiles,
              connectedAt: connection.createdAt.toISOString(),
            }
          : null
      }
    />
  );
}
