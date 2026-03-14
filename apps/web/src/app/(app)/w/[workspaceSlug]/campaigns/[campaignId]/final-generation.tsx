"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateFinalImage } from "@/app/actions/campaign";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
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
      description: `Image ${i + 1} for ${MEDIA_TYPE_LABELS[campaign.mediaType] ?? campaign.mediaType}`,
      status: "pending" as const,
    }))
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAll = useCallback(async () => {
    setIsGenerating(true);

    for (let i = 0; i < slots.length; i++) {
      setSlots((prev) =>
        prev.map((s) =>
          s.index === i ? { ...s, status: "generating" } : s
        )
      );

      try {
        const result = await generateFinalImage(campaign.id, {
          workspaceId: campaign.workspaceId,
          briefingSummary: briefing,
          imageDescription: `Image ${i + 1}: ${briefing}`,
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
                  error:
                    err instanceof Error
                      ? err.message
                      : "Failed to generate",
                }
              : s
          )
        );
      }
    }

    setIsGenerating(false);
  }, [slots.length, campaign.id, campaign.workspaceId, campaign.mediaType, briefing]);

  // Auto-start generation
  useEffect(() => {
    generateAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = slots.filter((s) => s.status === "done").length;
  const allDone = doneCount === slots.length;

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
              ? `${doneCount} images generated`
              : isGenerating
                ? `Generating image ${doneCount + 1} of ${slots.length}...`
                : "Preparing..."}
          </p>
        </div>

        {/* Briefing summary */}
        <div className="mb-8 rounded-xl border bg-muted/30 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Briefing
          </h3>
          <p className="text-sm leading-relaxed text-foreground/80">
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
