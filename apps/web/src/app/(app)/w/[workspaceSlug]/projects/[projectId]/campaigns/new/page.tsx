import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CampaignBuilder } from "./campaign-builder";

type Params = { workspaceSlug: string; projectId: string };

export default async function NewCampaignPage({
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
    select: { id: true, name: true, platforms: true },
  });

  if (!project) {
    notFound();
  }

  return (
    <CampaignBuilder
      workspaceSlug={workspaceSlug}
      project={{
        id: project.id,
        name: project.name,
        platforms: project.platforms,
      }}
    />
  );
}
