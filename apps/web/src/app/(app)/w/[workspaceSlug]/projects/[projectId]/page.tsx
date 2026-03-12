import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProjectDetail } from "./project-detail";

type Params = { workspaceSlug: string; projectId: string };

export default async function ProjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { workspaceSlug, projectId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true, slug: true },
  });

  if (!workspace) {
    notFound();
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: workspace.id },
    include: {
      campaigns: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          mediaType: true,
          prompt: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <ProjectDetail
      workspaceSlug={workspaceSlug}
      project={{
        id: project.id,
        name: project.name,
        brief: project.brief,
        audience: project.audience,
        platforms: project.platforms,
        notes: project.notes,
        campaigns: project.campaigns.map((c) => ({
          id: c.id,
          mediaType: c.mediaType,
          prompt: c.prompt,
          status: c.status,
          createdAt: c.createdAt.toISOString(),
        })),
      }}
    />
  );
}
