"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createCampaign } from "@/app/actions/campaign";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Sparkles,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

type Props = {
  workspaceSlug: string;
};

type FormatOption = {
  value: string;
  label: string;
  detail: string;
  /** Visual preview: renders the aspect ratio shape */
  preview: "square" | "tall" | "wide" | "slides-square" | "slides-wide";
};

type PlatformGroup = {
  id: string;
  platform: string;
  icon: string;
  /** Whether the icon needs inversion in dark mode (black logos) */
  invertDark?: boolean;
  formats: FormatOption[];
};

const PLATFORM_GROUPS: PlatformGroup[] = [
  {
    id: "instagram",
    platform: "Instagram",
    icon: "/icons/social/instagram.svg",
    formats: [
      { value: "instagram_post", label: "Post", detail: "1:1 image", preview: "square" },
      { value: "instagram_carousel", label: "Carousel", detail: "1:1 slides", preview: "slides-square" },
      { value: "instagram_reel", label: "Reel", detail: "9:16 video", preview: "tall" },
    ],
  },
  {
    id: "youtube",
    platform: "YouTube",
    icon: "/icons/social/youtube.svg",
    formats: [
      { value: "youtube_shorts", label: "Shorts", detail: "9:16 video", preview: "tall" },
      { value: "youtube_video", label: "Video", detail: "16:9 video", preview: "wide" },
    ],
  },
  {
    id: "tiktok",
    platform: "TikTok",
    icon: "/icons/social/tiktok.svg",
    formats: [
      { value: "tiktok_video", label: "Video", detail: "9:16 video", preview: "tall" },
    ],
  },
  {
    id: "x",
    platform: "X",
    icon: "/icons/social/x.svg",
    invertDark: true,
    formats: [
      { value: "x_post", label: "Post", detail: "16:9 image", preview: "wide" },
      { value: "x_thread", label: "Thread", detail: "16:9 multi-post", preview: "slides-wide" },
    ],
  },
  {
    id: "linkedin",
    platform: "LinkedIn",
    icon: "/icons/social/linkedin.svg",
    formats: [
      { value: "linkedin_post", label: "Post", detail: "1.91:1 image", preview: "wide" },
      { value: "linkedin_carousel", label: "Carousel", detail: "1:1 slides", preview: "slides-square" },
    ],
  },
];

/** Renders a visual aspect ratio preview shape */
function FormatPreview({
  type,
  selected,
}: {
  type: FormatOption["preview"];
  selected: boolean;
}) {
  const base = cn(
    "rounded-[3px] border transition-colors duration-200",
    selected
      ? "border-[#f6b900]/50 bg-[#f6b900]/12"
      : "border-foreground/[0.08] bg-foreground/[0.03] group-hover/card:border-foreground/[0.13] group-hover/card:bg-foreground/[0.05]"
  );

  switch (type) {
    case "square":
      return <div className={cn(base, "h-10 w-10")} />;
    case "tall":
      return <div className={cn(base, "h-12 w-[28px]")} />;
    case "wide":
      return <div className={cn(base, "h-[28px] w-12")} />;
    case "slides-square":
      return (
        <div className="flex items-end gap-[3px]">
          <div className={cn(base, "h-9 w-9")} />
          <div className={cn(base, "h-9 w-9 opacity-60")} />
          <div className={cn(base, "h-9 w-9 opacity-30")} />
        </div>
      );
    case "slides-wide":
      return (
        <div className="flex items-end gap-[3px]">
          <div className={cn(base, "h-[24px] w-10")} />
          <div className={cn(base, "h-[24px] w-10 opacity-60")} />
          <div className={cn(base, "h-[24px] w-10 opacity-30")} />
        </div>
      );
  }
}

export function CampaignBuilder({ workspaceSlug }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [instructions, setInstructions] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/w/${workspaceSlug}`;
  const canGenerate = selectedType && prompt.trim().length > 0 && !isPending;

  function handleGenerate() {
    if (!canGenerate) return;
    setError(null);

    startTransition(async () => {
      try {
        const result = await createCampaign({
          workspaceSlug,
          mediaType: selectedType,
          prompt: prompt.trim(),
          instructions: instructions.trim() || undefined,
        });

        router.push(`${base}/campaigns/${result.campaignId}`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      }
    });
  }

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href={`${base}/campaigns`}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Campaigns
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            New Campaign
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a format and describe what you want to create.
          </p>
        </div>

        {/* Step 1: Format picker */}
        <div className="mb-10">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              1
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
              Format
            </h2>
          </div>

          <Tabs defaultValue="instagram" className="w-full">
            <TabsList className="w-full bg-muted/50">
              {PLATFORM_GROUPS.map((group) => (
                <TabsTrigger key={group.id} value={group.id} className="relative gap-2">
                  <NextImage
                    src={group.icon}
                    alt=""
                    width={16}
                    height={16}
                    className={cn(
                      "shrink-0",
                      group.invertDark && "dark:invert"
                    )}
                  />
                  <span className="hidden sm:inline">{group.platform}</span>
                  {group.formats.some((f) => f.value === selectedType) && (
                    <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#f6b900]" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {PLATFORM_GROUPS.map((group) => (
              <TabsContent key={group.id} value={group.id}>
                <div
                  className={cn(
                    "grid gap-3",
                    group.formats.length === 1
                      ? "grid-cols-1 max-w-[200px]"
                      : group.formats.length === 2
                        ? "grid-cols-2 max-w-[400px]"
                        : "grid-cols-3"
                  )}
                >
                  {group.formats.map((format) => {
                    const isSelected = selectedType === format.value;

                    return (
                      <button
                        key={format.value}
                        type="button"
                        disabled={isPending}
                        onClick={() => setSelectedType(format.value)}
                        className={cn(
                          "group/card relative flex flex-col items-center rounded-xl border px-4 py-5 text-center transition-all duration-200",
                          isSelected
                            ? "border-[#f6b900]/40 bg-[#f6b900]/[0.05] shadow-[inset_0_1px_0_0_rgba(246,185,0,0.1),0_0_0_1px_rgba(246,185,0,0.12)]"
                            : "border-border/50 bg-background hover:border-foreground/12 hover:bg-muted/25 hover:shadow-sm",
                          isPending && "pointer-events-none opacity-50"
                        )}
                      >
                        {/* Aspect ratio preview */}
                        <div className="mb-3.5 flex h-14 items-center justify-center">
                          <FormatPreview
                            type={format.preview}
                            selected={isSelected}
                          />
                        </div>

                        {/* Label */}
                        <span
                          className={cn(
                            "text-sm font-medium leading-tight transition-colors",
                            isSelected
                              ? "text-foreground"
                              : "text-foreground/80"
                          )}
                        >
                          {format.label}
                        </span>

                        {/* Detail */}
                        <span className="mt-1 text-[11px] text-muted-foreground">
                          {format.detail}
                        </span>

                        {/* Selected check */}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f6b900]">
                            <svg
                              className="h-2.5 w-2.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <Separator className="mb-10" />

        {/* Step 2: Prompt */}
        <div className="mb-8">
          <div className="mb-4 flex items-baseline gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              2
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
              Brief
            </h2>
          </div>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the content you want to create..."
            rows={5}
            disabled={isPending}
            className="resize-none text-sm leading-relaxed"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Be specific about the message, tone, and any key visuals you
            want included. The AI will use your brand knowledge to stay
            on-brand.
          </p>
        </div>

        {/* Advanced instructions (collapsible) */}
        <div className="mb-10">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
            Advanced instructions
          </button>

          <div
            className={`grid transition-all duration-200 ${
              showAdvanced
                ? "mt-3 grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Additional creative direction, constraints, or specific requirements..."
                rows={3}
                disabled={isPending}
                className="resize-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Generate button */}
        <Button
          size="lg"
          className="h-11 w-full gap-2 text-[15px] font-semibold disabled:bg-muted disabled:text-muted-foreground"
          disabled={!canGenerate}
          onClick={handleGenerate}
        >
          <Sparkles className="h-4 w-4" />
          Generate
        </Button>
      </div>
    </div>
  );
}
