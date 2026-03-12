"use client";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  LogOut,
  FolderPlus,
  HardDrive,
  Settings,
  Plus,
} from "lucide-react";

type WorkspaceDashboardProps = {
  workspace: {
    name: string;
    slug: string;
    category: string;
    description: string | null;
    projectCount: number;
    sourceCount: number;
  };
  user: {
    name: string;
    image?: string;
    role: string;
  };
};

export function WorkspaceDashboard({
  workspace,
  user,
}: WorkspaceDashboardProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              {workspace.name}
            </span>
            <Badge variant="outline" className="text-[10px] capitalize">
              {workspace.category}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.image} />
              <AvatarFallback className="text-xs">
                {user.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = "/login";
                    },
                  },
                })
              }
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workspace.description ??
              "Manage your projects and generate content."}
          </p>
        </div>

        {/* Quick stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{workspace.projectCount}</p>
            <p className="text-xs text-muted-foreground">Projects</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-semibold">{workspace.sourceCount}</p>
            <p className="text-xs text-muted-foreground">Connected sources</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer border-dashed transition-colors hover:border-primary/50 hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">New project</CardTitle>
              </div>
              <CardDescription>
                Start a new content project for your brand.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer border-dashed transition-colors hover:border-primary/50 hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Connect Google Drive</CardTitle>
              </div>
              <CardDescription>
                Link your brand assets and knowledge base.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer border-dashed transition-colors hover:border-primary/50 hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Workspace settings</CardTitle>
              </div>
              <CardDescription>
                Update brand details, members, and preferences.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
