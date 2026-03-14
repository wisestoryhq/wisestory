"use client";

import { BriefingChat } from "./briefing-chat";
import { Loader2 } from "lucide-react";

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
  if (campaign.status === "generating_doc") {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#f6b900]" />
          <p className="mt-4 text-sm text-muted-foreground">
            Generating briefing document...
          </p>
        </div>
      </div>
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
