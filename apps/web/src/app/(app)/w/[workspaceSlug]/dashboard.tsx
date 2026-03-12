"use client";

import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FolderKanban,
  HardDrive,
  Sparkles,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type WorkspaceDashboardProps = {
  workspace: {
    name: string;
    slug: string;
    description: string | null;
    projectCount: number;
    sourceCount: number;
    campaignCount: number;
  };
};

export function WorkspaceDashboard({ workspace }: WorkspaceDashboardProps) {
  const base = `/w/${workspace.slug}`;
  const isEmpty =
    workspace.projectCount === 0 && workspace.sourceCount === 0;

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workspace.description ?? `Overview of ${workspace.name}.`}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FolderKanban className="h-3.5 w-3.5" />
              <span className="text-xs">Projects</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">
              {workspace.projectCount}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HardDrive className="h-3.5 w-3.5" />
              <span className="text-xs">Sources</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">
              {workspace.sourceCount}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs">Campaigns</span>
            </div>
            <p className="mt-1 text-2xl font-semibold">
              {workspace.campaignCount}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">
              Get started with {workspace.name}
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              Connect your Google Drive to import brand assets, then create your
              first project to start generating content.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href={`${base}/sources`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <HardDrive className="h-3.5 w-3.5" />
                  Connect sources
                </Button>
              </Link>
              <Link href={`${base}/projects`}>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  New project
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick actions (when not empty) */}
        {!isEmpty && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href={`${base}/projects`}>
              <Card className="group cursor-pointer transition-colors hover:border-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Projects</CardTitle>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <CardDescription>
                    View and manage your content projects.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href={`${base}/sources`}>
              <Card className="group cursor-pointer transition-colors hover:border-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Sources</CardTitle>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <CardDescription>
                    Manage connected brand assets and knowledge.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
