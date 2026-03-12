"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, LogOut } from "lucide-react";

export default function WorkspacePage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              WiseStory
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={session?.user?.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })}
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
            Welcome, {session?.user?.name ?? "there"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a workspace or create a new one to get started.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm">Create workspace</CardTitle>
              <CardDescription>
                Set up a new workspace for your team or project.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
