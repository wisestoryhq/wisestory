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

  return (
    <SourcesView
      workspaceSlug={workspace.slug}
      connection={
        connection
          ? {
              id: connection.id,
              status: connection.status,
              folderIds: connection.folderIds,
              fileCount: connection._count.sourceFiles,
              connectedAt: connection.createdAt.toISOString(),
            }
          : null
      }
    />
  );
}
