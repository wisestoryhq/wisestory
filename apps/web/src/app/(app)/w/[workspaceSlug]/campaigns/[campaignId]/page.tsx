import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { BriefingDocument } from "./campaign-output";
import { CreativeArea } from "./creative-area";

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
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!campaign) notFound();

  // Briefing phase or generating doc: show the creative area
  if (campaign.status === "briefing" || campaign.status === "generating_doc") {
    const messages = campaign.messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      images: (m.images as Array<{ data: string; mimeType: string }>) ?? [],
      createdAt: m.createdAt.toISOString(),
    }));

    return (
      <CreativeArea
        workspaceSlug={workspaceSlug}
        campaign={{
          id: campaign.id,
          mediaType: campaign.mediaType,
          prompt: campaign.prompt,
          status: campaign.status,
          briefingSummary: campaign.briefingSummary ?? null,
          workspaceId: workspace.id,
        }}
        initialMessages={messages}
      />
    );
  }

  // Completed/failed/draft: show the existing campaign output
  const output = campaign.outputs[0];
  const parts = (output?.parts as Array<Record<string, string>>) ?? [];

  return (
    <BriefingDocument
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
