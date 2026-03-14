import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CampaignOutput } from "./campaign-output";

type Params = {
  workspaceSlug: string;
  campaignId: string;
};

export default async function CampaignPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { workspaceSlug, campaignId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true },
  });

  if (!workspace) notFound();

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      workspaceId: workspace.id,
    },
    include: {
      outputs: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!campaign) notFound();

  const output = campaign.outputs[0];
  const parts = (output?.parts as Array<Record<string, string>>) ?? [];

  return (
    <CampaignOutput
      workspaceSlug={workspaceSlug}
      campaign={{
        id: campaign.id,
        mediaType: campaign.mediaType,
        prompt: campaign.prompt,
        status: campaign.status,
        createdAt: campaign.createdAt.toISOString(),
      }}
      parts={parts.map((p) => {
        if (p.type === "image") {
          return {
            type: "image" as const,
            data: p.data,
            mimeType: p.mimeType ?? "image/png",
          };
        }
        return {
          type: "text" as const,
          content: p.content ?? "",
        };
      })}
    />
  );
}
