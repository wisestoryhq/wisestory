"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  Plus,
  Sparkles,
} from "lucide-react";
import { CreateProjectDialog } from "./create-project-dialog";

type Project = {
  id: string;
  name: string;
  brief: string | null;
  audience: string | null;
  platforms: string[];
  campaignCount: number;
  createdAt: string;
};

type ProjectListProps = {
  workspaceSlug: string;
  projects: Project[];
};

const platformLabels: Record<string, string> = {
  instagram_post: "IG Post",
  instagram_carousel: "IG Carousel",
  instagram_reel: "IG Reel",
  tiktok_video: "TikTok",
  youtube_shorts: "YT Shorts",
  youtube_video: "YouTube",
  multi_platform_campaign: "Multi-platform",
};

export function ProjectList({ workspaceSlug, projects }: ProjectListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your content projects.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New project
          </Button>
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">No projects yet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              Create your first project to start generating content for your
              brand.
            </p>
            <Button
              size="sm"
              className="mt-6 gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Create project
            </Button>
          </div>
        )}

        {/* Project grid */}
        {projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/w/${workspaceSlug}/projects/${project.id}`}
              >
                <Card className="group cursor-pointer transition-colors hover:border-primary/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{project.name}</CardTitle>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3" />
                        {project.campaignCount}
                      </div>
                    </div>
                    {project.brief && (
                      <CardDescription className="line-clamp-2">
                        {project.brief}
                      </CardDescription>
                    )}
                    {project.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {project.platforms.map((p) => (
                          <Badge
                            key={p}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {platformLabels[p] ?? p}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog
        workspaceSlug={workspaceSlug}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
