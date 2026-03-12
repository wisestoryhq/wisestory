import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProjectList } from "./project-list";

type Params = { workspaceSlug: string };

export default async function ProjectsPage({
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
      projects: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          brief: true,
          audience: true,
          platforms: true,
          createdAt: true,
          _count: {
            select: { campaigns: true },
          },
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <ProjectList
      workspaceSlug={workspace.slug}
      projects={workspace.projects.map((p) => ({
        id: p.id,
        name: p.name,
        brief: p.brief,
        audience: p.audience,
        platforms: p.platforms,
        campaignCount: p._count.campaigns,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
