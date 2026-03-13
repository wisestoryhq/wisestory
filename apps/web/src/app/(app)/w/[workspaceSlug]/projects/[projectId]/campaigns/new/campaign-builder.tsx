"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { createCampaign } from "@/app/actions/campaign";
import {
  ArrowLeft,
  Image,
  Layers,
  Film,
  Video,
  Play,
  Monitor,
  Globe,
  Sparkles,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

type Props = {
  workspaceSlug: string;
  project: {
    id: string;
    name: string;
    platforms: string[];
  };
};

type MediaTypeOption = {
  value: string;
  label: string;
  format: string;
  ratio: string;
  icon: React.ElementType;
  canvasClass: string;
};

const MEDIA_TYPES: MediaTypeOption[] = [
  {
    value: "instagram_post",
    label: "Instagram Post",
    format: "Image",
    ratio: "1:1",
    icon: Image,
    canvasClass: "aspect-square",
  },
  {
    value: "instagram_carousel",
    label: "Instagram Carousel",
    format: "Multi-slide",
    ratio: "1:1",
    icon: Layers,
    canvasClass: "aspect-square",
  },
  {
    value: "instagram_reel",
    label: "Instagram Reel",
    format: "Video",
    ratio: "9:16",
    icon: Film,
    canvasClass: "aspect-[9/16]",
  },
  {
    value: "tiktok_video",
    label: "TikTok Video",
    format: "Video",
    ratio: "9:16",
    icon: Video,
    canvasClass: "aspect-[9/16]",
  },
  {
    value: "youtube_shorts",
    label: "YouTube Shorts",
    format: "Video",
    ratio: "9:16",
    icon: Play,
    canvasClass: "aspect-[9/16]",
  },
  {
    value: "youtube_video",
    label: "YouTube Video",
    format: "Video",
    ratio: "16:9",
    icon: Monitor,
    canvasClass: "aspect-video",
  },
  {
    value: "multi_platform_campaign",
    label: "Multi-Platform",
    format: "Package",
    ratio: "Multiple",
    icon: Globe,
    canvasClass: "aspect-[4/3]",
  },
];

export function CampaignBuilder({ workspaceSlug, project }: Props) {
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
          projectId: project.id,
          mediaType: selectedType,
          prompt: prompt.trim(),
          instructions: instructions.trim() || undefined,
        });

        // Redirect immediately — generation streams on the campaign page
        router.push(
          `${base}/projects/${project.id}/campaigns/${result.campaignId}`
        );
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
          href={`${base}/projects/${project.id}`}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {project.name}
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

        {/* Step 1: Media type */}
        <div className="mb-10">
          <div className="mb-4 flex items-baseline gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              1
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
              Format
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {MEDIA_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => setSelectedType(type.value)}
                  className={`group relative flex flex-col items-center rounded-xl border p-4 text-center transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-primary/[0.04] ring-1 ring-primary/30"
                      : "border-border hover:border-foreground/20 hover:bg-muted/50"
                  } ${isPending ? "pointer-events-none opacity-50" : ""}`}
                >
                  <div
                    className={`mb-3 w-10 ${type.canvasClass} rounded-[4px] border transition-colors ${
                      isSelected
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-muted/60 group-hover:border-foreground/15"
                    } flex items-center justify-center`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 transition-colors ${
                        isSelected
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground/60"
                      }`}
                    />
                  </div>

                  <span
                    className={`text-[13px] font-medium leading-tight ${
                      isSelected ? "text-foreground" : "text-foreground/80"
                    }`}
                  >
                    {type.label}
                  </span>

                  <span className="mt-1 text-[10px] text-muted-foreground">
                    {type.format} · {type.ratio}
                  </span>
                </button>
              );
            })}
          </div>
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
          className="w-full gap-2"
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
