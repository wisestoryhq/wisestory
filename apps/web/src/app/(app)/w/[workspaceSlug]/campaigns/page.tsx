import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CampaignList } from "./campaign-list";

type Params = { workspaceSlug: string };

export default async function CampaignsPage({
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

  if (!workspace) {
    notFound();
  }

  return (
    <CampaignList
      workspaceSlug={workspace.slug}
      campaigns={workspace.campaigns.map((c) => ({
        id: c.id,
        mediaType: c.mediaType,
        prompt: c.prompt,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
