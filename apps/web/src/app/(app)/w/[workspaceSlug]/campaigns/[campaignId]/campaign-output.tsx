"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteCampaign } from "@/app/actions/campaign";
import {
  ArrowLeft,
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

function TextBlock({ content }: { content: string }) {
  // Simple markdown rendering
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Headings
        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="mt-6 mb-2 text-lg font-semibold tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {renderInline(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="mt-8 mb-3 text-xl font-bold tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {renderInline(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={i}
              className="mt-8 mb-4 text-2xl font-bold tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {renderInline(trimmed.slice(2))}
            </h1>
          );
        }

        // Bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2 pl-4">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
              <p className="text-sm leading-relaxed text-foreground/90">
                {renderInline(trimmed.slice(2))}
              </p>
            </div>
          );
        }

        // Numbered list
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-2 pl-4">
              <span className="shrink-0 text-sm font-medium text-muted-foreground">
                {numberedMatch[1]}.
              </span>
              <p className="text-sm leading-relaxed text-foreground/90">
                {renderInline(numberedMatch[2])}
              </p>
            </div>
          );
        }

        // Horizontal rule
        if (trimmed === "---" || trimmed === "***") {
          return <hr key={i} className="my-6 border-border/50" />;
        }

        // Regular paragraph
        return (
          <p key={i} className="text-sm leading-relaxed text-foreground/90">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Bold + italic
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={match.index}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      parts.push(<strong key={match.index}>{match[3]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(<strong key={match.index}>{match[5]}</strong>);
    } else if (match[6]) {
      parts.push(<em key={match.index}>{match[6]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function BriefingDocument({ workspaceSlug, campaign, parts }: Props) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();

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
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Creative Briefing
            </h1>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{mediaLabel}</span>
              <span>·</span>
              <span>{createdDate}</span>
            </div>
          </div>

          {/* Document body */}
          <div className="px-8 py-6 space-y-4">
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

            {parts.map((part, index) => {
              if (part.type === "text") {
                return <TextBlock key={index} content={part.content} />;
              }
              if (part.type === "image") {
                return (
                  <div key={index} className="my-6">
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
  );
}
