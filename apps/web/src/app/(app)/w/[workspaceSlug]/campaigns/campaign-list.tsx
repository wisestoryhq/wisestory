"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Plus,
  Image as ImageIcon,
  Layers,
  Film,
  Video,
  Play,
  Monitor,
  Globe,
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

const MEDIA_TYPE_ICONS: Record<string, React.ElementType> = {
  instagram_post: ImageIcon,
  instagram_carousel: Layers,
  instagram_reel: Film,
  tiktok_video: Video,
  youtube_shorts: Play,
  youtube_video: Monitor,
  x_post: Globe,
  x_thread: Globe,
  linkedin_post: Globe,
  linkedin_carousel: Globe,
  multi_platform_campaign: Globe,
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  generating: {
    label: "Generating",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
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

type Campaign = {
  id: string;
  mediaType: string;
  prompt: string;
  status: string;
  createdAt: string;
};

type CampaignListProps = {
  workspaceSlug: string;
  campaigns: Campaign[];
};

export function CampaignList({ workspaceSlug, campaigns }: CampaignListProps) {
  const base = `/w/${workspaceSlug}`;

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your generated content campaigns.
            </p>
          </div>
          <Link href={`${base}/campaigns/new`}>
            <Button className="gap-1.5 px-4">
              <Plus className="h-3.5 w-3.5" />
              New campaign
            </Button>
          </Link>
        </div>

        {/* Empty state */}
        {campaigns.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">No campaigns yet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              Create your first campaign to start generating content for your brand.
            </p>
            <Link href={`${base}/campaigns/new`}>
              <Button size="sm" className="mt-6 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Create campaign
              </Button>
            </Link>
          </div>
        )}

        {/* Campaign list */}
        {campaigns.length > 0 && (
          <div className="space-y-2">
            {campaigns.map((campaign) => {
              const Icon = MEDIA_TYPE_ICONS[campaign.mediaType] ?? Globe;
              const statusInfo = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft;

              return (
                <Link
                  key={campaign.id}
                  href={`${base}/campaigns/${campaign.id}`}
                  className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:border-[#f6b900]/30 hover:shadow-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {campaign.prompt}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {MEDIA_TYPE_LABELS[campaign.mediaType] ?? campaign.mediaType}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 text-[10px] ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
