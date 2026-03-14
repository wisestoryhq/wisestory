import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CampaignBuilder } from "./campaign-builder";

type Params = { workspaceSlug: string };

export default async function NewCampaignPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { workspaceSlug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true, slug: true },
  });

  if (!workspace) {
    notFound();
  }

  return <CampaignBuilder workspaceSlug={workspaceSlug} />;
}
