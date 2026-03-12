"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { createProject } from "@/app/actions/project";

const mediaTypes = [
  { value: "instagram_post", label: "IG Post" },
  { value: "instagram_carousel", label: "IG Carousel" },
  { value: "instagram_reel", label: "IG Reel" },
  { value: "tiktok_video", label: "TikTok" },
  { value: "youtube_shorts", label: "YT Shorts" },
  { value: "youtube_video", label: "YouTube" },
  { value: "multi_platform_campaign", label: "Multi-platform" },
] as const;

type CreateProjectDialogProps = {
  workspaceSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateProjectDialog({
  workspaceSlug,
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [audience, setAudience] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function togglePlatform(value: string) {
    setPlatforms((prev) =>
      prev.includes(value)
        ? prev.filter((p) => p !== value)
        : [...prev, value],
    );
  }

  function handleSubmit() {
    startTransition(() =>
      createProject({
        workspaceSlug,
        name: name.trim(),
        brief: brief.trim() || undefined,
        audience: audience.trim() || undefined,
        platforms,
        notes: notes.trim() || undefined,
      }),
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Create a content project for your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              placeholder="Spring Launch 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brief">
              Brief{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="brief"
              placeholder="What's this project about? What are the goals?"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">
              Target audience{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="audience"
              placeholder="Tech-savvy millennials, 25-35"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-1.5">
              {mediaTypes.map((mt) => {
                const selected = platforms.includes(mt.value);
                return (
                  <button
                    key={mt.value}
                    type="button"
                    onClick={() => togglePlatform(mt.value)}
                    className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                      selected
                        ? "border-primary bg-primary/5 font-medium text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                    }`}
                  >
                    {mt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Any additional context or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            className="w-full"
            disabled={!name.trim() || isPending}
            onClick={handleSubmit}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create project"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
