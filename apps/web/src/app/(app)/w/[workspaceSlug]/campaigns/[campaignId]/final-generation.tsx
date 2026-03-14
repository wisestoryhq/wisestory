"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateFinalImage, generateCaption } from "@/app/actions/campaign";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
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

/** Number of images to generate per media type */
const IMAGE_COUNTS: Record<string, number> = {
  instagram_post: 1,
  instagram_carousel: 5,
  instagram_reel: 3,
  tiktok_video: 3,
  youtube_shorts: 3,
  youtube_video: 3,
  x_post: 1,
  x_thread: 3,
  linkedin_post: 1,
  linkedin_carousel: 5,
  multi_platform_campaign: 3,
};

type ImageSlot = {
  index: number;
  description: string;
  status: "pending" | "generating" | "done" | "error";
  image?: { data: string; mimeType: string };
  error?: string;
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
};

export function FinalGeneration({ workspaceSlug, campaign }: Props) {
  const router = useRouter();
  const base = `/w/${workspaceSlug}`;
  const imageCount = IMAGE_COUNTS[campaign.mediaType] ?? 1;
  const briefing = campaign.briefingSummary || campaign.prompt;

  const [slots, setSlots] = useState<ImageSlot[]>(() =>
    Array.from({ length: imageCount }, (_, i) => ({
      index: i,
      description: buildImageDescription(campaign.mediaType, briefing, i, imageCount),
      status: "pending" as const,
    }))
  );
  const [caption, setCaption] = useState<string | null>(null);
  const [captionStatus, setCaptionStatus] = useState<"pending" | "generating" | "done" | "error">("pending");
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAll = useCallback(async () => {
    setIsGenerating(true);

    // Generate images sequentially
    for (let i = 0; i < imageCount; i++) {
      setSlots((prev) =>
        prev.map((s) =>
          s.index === i ? { ...s, status: "generating" } : s
        )
      );

      const desc = buildImageDescription(campaign.mediaType, briefing, i, imageCount);

      try {
        const result = await generateFinalImage(campaign.id, {
          workspaceId: campaign.workspaceId,
          briefingSummary: briefing,
          imageDescription: desc,
          mediaType: campaign.mediaType,
          imageIndex: i,
        });

        setSlots((prev) =>
          prev.map((s) =>
            s.index === i
              ? { ...s, status: "done", image: result.image }
              : s
          )
        );
      } catch (err) {
        setSlots((prev) =>
          prev.map((s) =>
            s.index === i
              ? {
                  ...s,
                  status: "error",
                  error: err instanceof Error ? err.message : "Failed to generate",
                }
              : s
          )
        );
      }
    }

    // Generate caption + hashtags
    setCaptionStatus("generating");
    try {
      const result = await generateCaption(
        campaign.workspaceId,
        briefing,
        campaign.mediaType
      );
      setCaption(result.caption);
      setCaptionStatus("done");
    } catch (err) {
      setCaptionError(err instanceof Error ? err.message : "Failed to generate caption");
      setCaptionStatus("error");
    }

    setIsGenerating(false);
  }, [imageCount, campaign.id, campaign.workspaceId, campaign.mediaType, briefing]);

  // Auto-start generation
  useEffect(() => {
    generateAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = slots.filter((s) => s.status === "done").length;
  const allDone = doneCount === slots.length && captionStatus === "done";

  function handleCopy() {
    if (caption) {
      navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <Link
          href={`${base}/campaigns`}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Campaigns
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Generating Content
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {MEDIA_TYPE_LABELS[campaign.mediaType] ?? campaign.mediaType}
            {" — "}
            {allDone
              ? "All content generated"
              : isGenerating
                ? `Generating image ${Math.min(doneCount + 1, slots.length)} of ${slots.length}...`
                : "Preparing..."}
          </p>
        </div>

        {/* Briefing summary */}
        <div className="mb-8 rounded-xl border bg-muted/30 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Briefing
          </h3>
          <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {briefing}
          </p>
        </div>

        {/* Image slots */}
        <div className="grid gap-4">
          {slots.map((slot) => (
            <div
              key={slot.index}
              className={cn(
                "overflow-hidden rounded-xl border transition-all duration-300",
                slot.status === "done"
                  ? "border-green-200 dark:border-green-900/50"
                  : slot.status === "error"
                    ? "border-red-200 dark:border-red-900/50"
                    : "border-border"
              )}
            >
              {/* Slot header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/20">
                {slot.status === "pending" && (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                )}
                {slot.status === "generating" && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#f6b900]" />
                )}
                {slot.status === "done" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {slot.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  Image {slot.index + 1}
                </span>
              </div>

              {/* Image content */}
              {slot.status === "generating" && (
                <div className="flex h-64 items-center justify-center bg-muted/10">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-full bg-[#f6b900]/20" />
                    <p className="text-sm text-muted-foreground">
                      Generating...
                    </p>
                  </div>
                </div>
              )}

              {slot.status === "done" && slot.image && (
                <div className="flex justify-center bg-muted/10 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:${slot.image.mimeType};base64,${slot.image.data}`}
                    alt={`Generated image ${slot.index + 1}`}
                    className="max-h-[500px] max-w-full rounded-lg object-contain"
                  />
                </div>
              )}

              {slot.status === "error" && (
                <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {slot.error || "Failed to generate image"}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Caption / Copy section */}
        <div className="mt-6">
          <div
            className={cn(
              "overflow-hidden rounded-xl border transition-all duration-300",
              captionStatus === "done"
                ? "border-green-200 dark:border-green-900/50"
                : captionStatus === "error"
                  ? "border-red-200 dark:border-red-900/50"
                  : "border-border"
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
              <div className="flex items-center gap-3">
                {captionStatus === "pending" && (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                )}
                {captionStatus === "generating" && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#f6b900]" />
                )}
                {captionStatus === "done" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {captionStatus === "error" && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Caption & Hashtags</span>
              </div>
              {caption && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            {captionStatus === "generating" && (
              <div className="flex h-24 items-center justify-center bg-muted/10">
                <p className="text-sm text-muted-foreground">
                  Writing caption...
                </p>
              </div>
            )}

            {captionStatus === "done" && caption && (
              <div className="px-4 py-4 bg-muted/10">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {caption}
                </p>
              </div>
            )}

            {captionStatus === "error" && (
              <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {captionError || "Failed to generate caption"}
              </div>
            )}
          </div>
        </div>

        {/* Done action */}
        {allDone && (
          <div className="mt-8 text-center">
            <Button
              onClick={() => router.push(`${base}/campaigns`)}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Build a descriptive image description based on the media type, briefing, and image index.
 */
function buildImageDescription(
  mediaType: string,
  briefing: string,
  index: number,
  total: number
): string {
  const label = MEDIA_TYPE_LABELS[mediaType] ?? mediaType;

  if (total === 1) {
    return `Hero image for ${label}. Creative concept: ${briefing}`;
  }

  // Multi-image formats get role-specific descriptions
  const isFirst = index === 0;
  const isLast = index === total - 1;

  if (isFirst) {
    return `Cover image (slide 1 of ${total}) for ${label}. This must be scroll-stopping and hook the viewer. Creative concept: ${briefing}`;
  }

  if (isLast) {
    return `Final image (slide ${index + 1} of ${total}) for ${label}. This is the CTA / closing slide — should feel like a satisfying conclusion. Creative concept: ${briefing}`;
  }

  return `Content image (slide ${index + 1} of ${total}) for ${label}. Continue the visual story — same color palette and style as other slides but with distinct content. Creative concept: ${briefing}`;
}
