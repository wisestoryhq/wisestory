"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
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
  projectId: string;
  projectName: string;
};

type WorkspaceDashboardProps = {
  userName: string;
  workspace: {
    name: string;
    slug: string;
    description: string | null;
    projectCount: number;
    sourceCount: number;
    campaignCount: number;
  };
  recentCampaigns: RecentCampaign[];
  projects: { id: string; name: string }[];
};

export function WorkspaceDashboard({
  userName,
  workspace,
  recentCampaigns,
  projects,
}: WorkspaceDashboardProps) {
  const base = `/w/${workspace.slug}`;
  const isNew =
    workspace.projectCount === 0 && workspace.sourceCount === 0;

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
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[
            {
              label: "Projects",
              count: workspace.projectCount,
              icon: FolderKanban,
              href: `${base}/projects`,
            },
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
              href: null,
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
                {stat.href && (
                  <Link
                    href={stat.href}
                    className="text-[11px] font-medium text-[#f6b900] hover:underline"
                  >
                    View
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Getting started checklist (only for new workspaces) */}
        {isNew && (
          <div className="mb-8 rounded-2xl border-2 border-dashed border-[#f6b900]/30 bg-[#f6b900]/[0.02] p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f6b900]/10">
                <Sparkles className="h-4.5 w-4.5 text-[#f6b900]" />
              </div>
              <div>
                <h2 className="text-base font-semibold">
                  Get started with {workspace.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Complete these steps to start generating content
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  done: true,
                  label: "Create workspace",
                  description: "Your workspace is ready",
                },
                {
                  done: workspace.sourceCount > 0,
                  label: "Connect Google Drive",
                  description: "Import your brand assets and documents",
                  href: `${base}/sources`,
                },
                {
                  done: workspace.projectCount > 0,
                  label: "Create your first project",
                  description: "Organize campaigns by project",
                  href: `${base}/projects`,
                },
              ].map((step) => (
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
        )}

        {/* Quick create + Recent campaigns */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Recent campaigns */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent campaigns</h2>
              {projects.length > 0 && (
                <Link href={`${base}/projects`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    All projects
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>

            {recentCampaigns.length === 0 && !isNew && (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <Sparkles className="mx-auto mb-3 h-5 w-5 text-muted-foreground/40" />
                <p className="text-sm font-medium">No campaigns yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create a project first, then generate your first campaign.
                </p>
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
                      href={`${base}/projects/${campaign.projectId}/campaigns/${campaign.id}`}
                      className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all hover:border-[#f6b900]/30 hover:shadow-sm"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {campaign.prompt}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            {campaign.projectName}
                          </span>
                          <span className="text-[11px] text-muted-foreground/40">
                            ·
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {MEDIA_TYPE_LABELS[campaign.mediaType] ??
                              campaign.mediaType}
                          </span>
                        </div>
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

          {/* Right sidebar: Quick actions */}
          <div className="space-y-4">
            {/* New campaign quick action */}
            {projects.length > 0 && (
              <div className="rounded-2xl border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold">Quick create</h3>
                <div className="space-y-2">
                  {projects.slice(0, 4).map((project) => (
                    <Link
                      key={project.id}
                      href={`${base}/projects/${project.id}/campaigns/new`}
                      className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors hover:border-[#f6b900]/30 hover:bg-[#f6b900]/[0.02]"
                    >
                      <span className="truncate font-medium text-foreground/80">
                        {project.name}
                      </span>
                      <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
                {projects.length > 4 && (
                  <Link
                    href={`${base}/projects`}
                    className="mt-3 block text-center text-xs font-medium text-[#f6b900] hover:underline"
                  >
                    View all {projects.length} projects
                  </Link>
                )}
              </div>
            )}

            {/* Quick links */}
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Quick links</h3>
              <div className="space-y-1">
                <Link
                  href={`${base}/projects`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <FolderKanban className="h-3.5 w-3.5" />
                  Projects
                </Link>
                <Link
                  href={`${base}/sources`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <HardDrive className="h-3.5 w-3.5" />
                  Sources
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
