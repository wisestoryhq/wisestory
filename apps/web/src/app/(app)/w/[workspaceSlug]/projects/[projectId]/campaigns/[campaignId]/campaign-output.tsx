"use client";

import { useEffect, useRef, useState } from "react";
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
  Brain,
  ChevronDown,
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
  const lines = content.split("\n");

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;

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

        if (trimmed === "---" || trimmed === "***") {
          return <Separator key={i} className="my-6" />;
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <li
              key={i}
              className="ml-4 text-sm leading-relaxed text-foreground/80"
            >
              {renderInline(trimmed.slice(2))}
            </li>
          );
        }

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
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
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

/** Animated dots for loading states */
function PulsingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="h-1 w-1 animate-pulse rounded-full bg-current" />
      <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
      <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
    </span>
  );
}

/** Collapsible chain-of-thought section */
function ThinkingSection({ lines }: { lines: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (lines.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-border/50 bg-muted/30">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Brain className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">Chain of thought</span>
        <span className="text-xs">({lines.length} steps)</span>
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-border/50 px-4 py-3">
          <div className="space-y-1.5 font-mono text-xs text-muted-foreground">
            {lines.map((line, i) => (
              <p key={i} className="leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CampaignOutput({
  workspaceSlug,
  projectId,
  projectName,
  campaign,
  parts: initialParts,
}: Props) {
  const base = `/w/${workspaceSlug}`;
  const Icon = MEDIA_TYPE_ICONS[campaign.mediaType] ?? Globe;

  // Streaming state
  const [streamedParts, setStreamedParts] = useState<Part[]>([]);
  const [thinking, setThinking] = useState<string[]>([]);
  const [status, setStatus] = useState(campaign.status);
  const [phase, setPhase] = useState<"idle" | "thinking" | "creating" | "done">(
    campaign.status === "generating" ? "thinking" : "done"
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  // Use initial parts if already completed, otherwise use streamed parts
  const parts = initialParts.length > 0 ? initialParts : streamedParts;

  // Auto-scroll to bottom as new content streams in
  useEffect(() => {
    if (phase === "done") return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamedParts, thinking, phase]);

  // Connect to SSE stream when campaign is generating
  useEffect(() => {
    if (campaign.status !== "generating") return;

    const eventSource = new EventSource(
      `/api/campaigns/${campaign.id}/stream`
    );

    eventSource.addEventListener("thinking", (e) => {
      const data = JSON.parse(e.data);
      setPhase("thinking");
      // Don't duplicate partial thinking lines — only add complete ones
      if (!data.partial) {
        setThinking((prev) => [...prev, data.text]);
      }
    });

    eventSource.addEventListener("part", (e) => {
      const data = JSON.parse(e.data);
      setPhase("creating");

      if (data.type === "text") {
        // Append partial text to the last text part, or create a new one
        setStreamedParts((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.type === "text") {
            // Append to existing text part
            const updated = [...prev];
            updated[updated.length - 1] = {
              type: "text",
              content: last.content + data.content,
            };
            return updated;
          }
          // New text part (after an image, or first part)
          return [...prev, { type: "text" as const, content: data.content }];
        });
      } else {
        // Images arrive complete
        setStreamedParts((prev) => [...prev, data]);
      }
    });

    eventSource.addEventListener("done", () => {
      setStatus("completed");
      setPhase("done");
      eventSource.close();
    });

    eventSource.addEventListener("error", (e) => {
      // EventSource fires generic error on connection close too
      if (eventSource.readyState === EventSource.CLOSED) return;
      console.error("SSE error:", e);
      setStatus("failed");
      setPhase("done");
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [campaign.id, campaign.status]);

  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    generating: {
      label: "Generating",
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
    },
    completed: {
      label: "Completed",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
    },
    failed: {
      label: "Failed",
      className:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
    },
  };

  const statusInfo = statusConfig[status] ?? statusConfig.draft;

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
                    {MEDIA_TYPE_LABELS[campaign.mediaType] ??
                      campaign.mediaType}
                  </h1>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${statusInfo.className}`}
                  >
                    {statusInfo.label}
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

        {/* Thinking phase indicator */}
        {phase === "thinking" && parts.length === 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
            <Brain className="h-4 w-4 animate-pulse text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Planning your content <PulsingDots />
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Retrieving brand knowledge and crafting a creative brief
              </p>
            </div>
          </div>
        )}

        {/* Chain of thought (collapsible) */}
        <ThinkingSection lines={thinking} />

        {/* Creating phase indicator (shown while streaming parts) */}
        {phase === "creating" && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium">
              Generating content <PulsingDots />
            </p>
          </div>
        )}

        {/* Content: streamed or loaded from DB */}
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

        {/* Failed state */}
        {status === "failed" && parts.length === 0 && (
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

        {/* Completed with no output */}
        {status === "completed" && parts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-sm text-muted-foreground">
              No output available.
            </p>
          </div>
        )}

        {/* Scroll anchor for auto-scroll during streaming */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
