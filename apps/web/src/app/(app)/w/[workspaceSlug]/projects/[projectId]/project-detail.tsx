"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Sparkles,
  Users,
  FileText,
  StickyNote,
  Plus,
} from "lucide-react";

const platformLabels: Record<string, string> = {
  instagram_post: "IG Post",
  instagram_carousel: "IG Carousel",
  instagram_reel: "IG Reel",
  tiktok_video: "TikTok",
  youtube_shorts: "YT Shorts",
  youtube_video: "YouTube",
  multi_platform_campaign: "Multi-platform",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  generating: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

type Campaign = {
  id: string;
  mediaType: string;
  prompt: string;
  status: string;
  createdAt: string;
};

type ProjectDetailProps = {
  workspaceSlug: string;
  project: {
    id: string;
    name: string;
    brief: string | null;
    audience: string | null;
    platforms: string[];
    notes: string | null;
    campaigns: Campaign[];
  };
};

export function ProjectDetail({ workspaceSlug, project }: ProjectDetailProps) {
  const base = `/w/${workspaceSlug}`;

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <Link
          href={`${base}/projects`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Projects
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            {project.platforms.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {project.platforms.map((p) => (
                  <Badge key={p} variant="secondary" className="text-[10px]">
                    {platformLabels[p] ?? p}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Link href={`${base}/projects/${project.id}/campaigns/new`}>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New campaign
            </Button>
          </Link>
        </div>

        {/* Info cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {project.brief && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <CardTitle className="text-xs font-medium">Brief</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{project.brief}</p>
              </CardContent>
            </Card>
          )}
          {project.audience && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <CardTitle className="text-xs font-medium">
                    Audience
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {project.audience}
                </p>
              </CardContent>
            </Card>
          )}
          {project.notes && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <StickyNote className="h-3.5 w-3.5" />
                  <CardTitle className="text-xs font-medium">Notes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{project.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="mb-8" />

        {/* Campaigns */}
        <div>
          <h2 className="mb-4 text-base font-semibold">Campaigns</h2>

          {project.campaigns.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-medium">No campaigns yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a campaign to start generating content.
              </p>
            </div>
          )}

          {project.campaigns.length > 0 && (
            <div className="space-y-2">
              {project.campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`${base}/projects/${project.id}/campaigns/${campaign.id}`}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {campaign.prompt}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {platformLabels[campaign.mediaType] ?? campaign.mediaType}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`ml-3 text-[10px] ${statusColors[campaign.status] ?? ""}`}
                  >
                    {campaign.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
