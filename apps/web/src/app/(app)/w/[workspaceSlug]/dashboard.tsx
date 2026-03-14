"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HardDrive,
  Sparkles,
  Plus,
  ArrowRight,
  Image as ImageIcon,
  Layers,
  Film,
  Video,
  Play,
  Monitor,
  Globe,
  CheckCircle2,
  Circle,
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

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  generating: {
    label: "Generating",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
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

type RecentCampaign = {
  id: string;
  mediaType: string;
  prompt: string;
  status: string;
  createdAt: string;
};

type WorkspaceDashboardProps = {
  userName: string;
  workspace: {
    name: string;
    slug: string;
    description: string | null;
    sourceCount: number;
    campaignCount: number;
    completedCampaignCount: number;
  };
  recentCampaigns: RecentCampaign[];
};

export function WorkspaceDashboard({
  userName,
  workspace,
  recentCampaigns,
}: WorkspaceDashboardProps) {
  const base = `/w/${workspace.slug}`;

  const firstName = userName?.split(" ")[0] ?? "there";

  return (
    <div className="px-6 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workspace.description ?? `Here's what's happening in ${workspace.name}.`}
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-3">
          {[
            {
              label: "Sources",
              count: workspace.sourceCount,
              icon: HardDrive,
              href: `${base}/sources`,
            },
            {
              label: "Campaigns",
              count: workspace.campaignCount,
              icon: Sparkles,
              href: `${base}/campaigns`,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-4 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </span>
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground/50" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {stat.count}
                </p>
                <Link
                  href={stat.href}
                  className="text-[11px] font-medium text-[#f6b900] hover:underline"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Getting started checklist — shown until all steps complete */}
        {(() => {
          const steps = [
            {
              done: true,
              label: "Create workspace",
              description: "Your workspace is ready",
            },
            {
              done: workspace.sourceCount > 0,
              label: "Connect Google Drive",
              description: "Import your brand assets, docs, and guidelines",
              href: `${base}/sources`,
            },
            {
              done: workspace.completedCampaignCount > 0,
              label: "Generate your first campaign",
              description: "Create on-brand content with AI",
              href: `${base}/campaigns/new`,
            },
          ];

          const allDone = steps.every((s) => s.done);
          if (allDone) return null;

          const doneCount = steps.filter((s) => s.done).length;

          return (
            <div className="mb-8 rounded-2xl border-2 border-dashed border-[#f6b900]/30 bg-[#f6b900]/[0.02] p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f6b900]/10">
                  <Sparkles className="h-4.5 w-4.5 text-[#f6b900]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold">
                    Get started with {workspace.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {doneCount} of {steps.length} steps complete
                  </p>
                </div>
                {/* Progress bar */}
                <div className="hidden w-24 sm:block">
                  <div className="h-1.5 rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-[#f6b900] transition-all duration-500"
                      style={{ width: `${(doneCount / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {steps.map((step) => (
                  <div
                    key={step.label}
                    className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-green-500" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 shrink-0 text-muted-foreground/40" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${step.done ? "text-muted-foreground line-through" : ""}`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    {!step.done && step.href && (
                      <Link href={step.href}>
                        <Button size="sm" variant="outline" className="gap-1 px-3">
                          Start
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Recent campaigns — only show after checklist is complete */}
        {workspace.completedCampaignCount > 0 && workspace.sourceCount > 0 && <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent campaigns</h2>
            {recentCampaigns.length > 0 && (
              <Link href={`${base}/campaigns`}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  All campaigns
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>

          {recentCampaigns.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <Sparkles className="mx-auto mb-3 h-5 w-5 text-muted-foreground/40" />
              <p className="text-sm font-medium">No campaigns yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create your first campaign to generate on-brand content.
              </p>
              <Link href={`${base}/campaigns/new`}>
                <Button size="sm" className="mt-4 gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  New campaign
                </Button>
              </Link>
            </div>
          )}

          {recentCampaigns.length > 0 && (
            <div className="space-y-2">
              {recentCampaigns.map((campaign) => {
                const Icon =
                  MEDIA_TYPE_ICONS[campaign.mediaType] ?? Globe;
                const statusInfo =
                  STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft;

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
                      <span className="text-[11px] text-muted-foreground">
                        {MEDIA_TYPE_LABELS[campaign.mediaType] ??
                          campaign.mediaType}
                      </span>
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
        </div>}
      </div>
    </div>
  );
}
