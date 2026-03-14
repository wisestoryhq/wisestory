"use client";

import { BriefingChat } from "./briefing-chat";
import { FinalGeneration } from "./final-generation";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images: Array<{ data: string; mimeType: string }>;
  createdAt: string;
};

type Campaign = {
  id: string;
  mediaType: string;
  prompt: string;
  status: string;
  briefingSummary: string | null;
  workspaceId: string;
};

type Props = {
  workspaceSlug: string;
  campaign: Campaign;
  initialMessages: Message[];
};

export function CreativeArea({ workspaceSlug, campaign, initialMessages }: Props) {
  if (campaign.status === "generating") {
    return (
      <FinalGeneration
        workspaceSlug={workspaceSlug}
        campaign={campaign}
      />
    );
  }

  return (
    <BriefingChat
      workspaceSlug={workspaceSlug}
      campaign={campaign}
      initialMessages={initialMessages}
    />
  );
}
