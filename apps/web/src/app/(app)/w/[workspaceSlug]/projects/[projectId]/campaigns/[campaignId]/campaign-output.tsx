"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Image as ImageIcon,
  Layers,
  Film,
  Video,
  Play,
  Monitor,
  Globe,
  AlertCircle,
  Loader2,
} from "lucide-react";

const MEDIA_TYPE_LABELS: Record<string, string> = {
  instagram_post: "Instagram Post",
  instagram_carousel: "Instagram Carousel",
  instagram_reel: "Instagram Reel",
  tiktok_video: "TikTok Video",
  youtube_shorts: "YouTube Shorts",
  youtube_video: "YouTube Video",
  multi_platform_campaign: "Multi-Platform",
};

const MEDIA_TYPE_ICONS: Record<string, React.ElementType> = {
  instagram_post: ImageIcon,
  instagram_carousel: Layers,
  instagram_reel: Film,
  tiktok_video: Video,
  youtube_shorts: Play,
  youtube_video: Monitor,
  multi_platform_campaign: Globe,
};

type TextPart = { type: "text"; content: string };
type ImagePart = { type: "image"; data: string; mimeType: string };
type Part = TextPart | ImagePart;

type Props = {
  workspaceSlug: string;
  projectId: string;
  projectName: string;
  campaign: {
    id: string;
    mediaType: string;
    prompt: string;
    status: string;
    createdAt: string;
  };
  parts: Part[];
};

function TextBlock({ content }: { content: string }) {
  // Simple markdown-ish rendering: headings, bold, paragraphs
  const lines = content.split("\n");

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;

        // Headings
        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="mt-6 mb-2 text-base font-semibold tracking-tight"
            >
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="mt-8 mb-3 text-lg font-semibold tracking-tight"
            >
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={i}
              className="mt-8 mb-3 text-xl font-semibold tracking-tight"
            >
              {trimmed.slice(2)}
            </h1>
          );
        }

        // Horizontal rule
        if (trimmed === "---" || trimmed === "***") {
          return <Separator key={i} className="my-6" />;
        }

        // List items
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <li key={i} className="ml-4 text-sm leading-relaxed text-foreground/80">
              {renderInline(trimmed.slice(2))}
            </li>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="text-sm leading-relaxed text-foreground/80">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  // Handle **bold** and *italic*
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // No more matches
    parts.push(remaining);
    break;
  }

  return parts;
}

function ImageBlock({ data, mimeType }: { data: string; mimeType: string }) {
  const src = `data:${mimeType};base64,${data}`;

  return (
    <div className="my-6 overflow-hidden rounded-xl border bg-muted/30">
      <img
        src={src}
        alt="Generated content"
        className="w-full object-contain"
      />
    </div>
  );
}

export function CampaignOutput({
  workspaceSlug,
  projectId,
  projectName,
  campaign,
  parts,
}: Props) {
  const base = `/w/${workspaceSlug}`;
  const Icon = MEDIA_TYPE_ICONS[campaign.mediaType] ?? Globe;

  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    generating: {
      label: "Generating",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    },
  };

  const status = statusConfig[campaign.status] ?? statusConfig.draft;

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href={`${base}/projects/${projectId}`}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {projectName}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-tight">
                    {MEDIA_TYPE_LABELS[campaign.mediaType] ?? campaign.mediaType}
                  </h1>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${status.className}`}
                  >
                    {status.label}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                  {campaign.prompt}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Content */}
        {campaign.status === "generating" && (
          <div className="flex flex-col items-center gap-4 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Generating your content...
            </p>
          </div>
        )}

        {campaign.status === "failed" && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm font-medium">Generation failed</p>
            <p className="text-xs text-muted-foreground">
              Try creating a new campaign with a different prompt.
            </p>
          </div>
        )}

        {campaign.status === "completed" && parts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-sm text-muted-foreground">
              No output available.
            </p>
          </div>
        )}

        {parts.length > 0 && (
          <div>
            {parts.map((part, i) => {
              if (part.type === "text") {
                return <TextBlock key={i} content={part.content} />;
              }
              if (part.type === "image") {
                return (
                  <ImageBlock
                    key={i}
                    data={part.data}
                    mimeType={part.mimeType}
                  />
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
