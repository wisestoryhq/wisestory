"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteCampaign, reopenBriefingChat } from "@/app/actions/campaign";
import { BriefingMarkdown } from "./briefing-markdown";
import {
  ArrowLeft,
  MessageSquare,
  Trash2,
} from "lucide-react";

const MEDIA_TYPE_LABELS: Record<string, string> = {
  instagram_post: "Instagram Post",
  instagram_carousel: "Instagram Carousel",
  instagram_reel: "Instagram Reel",
  tiktok_video: "TikTok Video",
  youtube_shorts: "YouTube Shorts",
  youtube_video: "YouTube Video",
  x_post: "X Post",
  x_thread: "X Thread",
  linkedin_post: "LinkedIn Post",
  linkedin_carousel: "LinkedIn Carousel",
  multi_platform_campaign: "Multi-Platform",
};

type TextPart = { type: "text"; content: string };
type ImagePart = { type: "image"; data: string; mimeType: string };
type Part = TextPart | ImagePart;

type Campaign = {
  id: string;
  mediaType: string;
  prompt: string;
  status: string;
  createdAt: string;
};

type Props = {
  workspaceSlug: string;
  campaign: Campaign;
  parts: Part[];
};

export function BriefingDocument({ workspaceSlug, campaign, parts }: Props) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const [isReopening, startReopen] = useTransition();

  const base = `/w/${workspaceSlug}`;
  const mediaLabel = MEDIA_TYPE_LABELS[campaign.mediaType] ?? campaign.mediaType;
  const createdDate = new Date(campaign.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function handleDelete() {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    startDelete(async () => {
      await deleteCampaign(campaign.id);
      router.push(`${base}/campaigns`);
    });
  }

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      {/* Header */}
      <div className="border-b bg-background print:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-3">
          <Link
            href={`${base}/campaigns`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-sm font-medium">{campaign.prompt}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">{mediaLabel}</p>
              <Badge
                variant="secondary"
                className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
              >
                Completed
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              startReopen(async () => {
                await reopenBriefingChat(campaign.id);
                router.refresh();
              });
            }}
            disabled={isReopening}
            className="text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Document */}
      <div className="mx-auto max-w-3xl px-6 py-8 print:px-0 print:py-4">
        <div className="rounded-xl border bg-background shadow-sm print:border-none print:shadow-none">
          {/* Document header */}
          <div className="border-b px-8 py-6 print:border-b-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Creative Briefing
            </h1>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{mediaLabel}</span>
              <span>·</span>
              <span>{createdDate}</span>
            </div>
          </div>

          {/* Document body */}
          <div className="px-8 py-6">
            {parts.length === 0 && campaign.status === "failed" && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                Briefing document generation failed. Try creating a new campaign.
              </div>
            )}

            {parts.length === 0 && campaign.status !== "failed" && (
              <p className="text-sm text-muted-foreground">
                No content generated yet.
              </p>
            )}

            <div className="briefing-prose">
              {parts.map((part, index) => {
                if (part.type === "text") {
                  return <BriefingMarkdown key={index} content={part.content} />;
                }
                if (part.type === "image") {
                  return (
                    <div key={index} className="my-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:${part.mimeType};base64,${part.data}`}
                        alt="Briefing reference image"
                        className="w-full rounded-lg shadow-sm"
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
