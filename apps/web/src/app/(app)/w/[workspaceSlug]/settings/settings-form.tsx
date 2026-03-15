"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateWorkspace } from "@/app/actions/workspace";
import { Loader2, Check } from "lucide-react";

const CATEGORIES = [
  { value: "news", label: "News" },
  { value: "fashion", label: "Fashion" },
  { value: "cooking", label: "Cooking" },
  { value: "gaming", label: "Gaming" },
  { value: "tech", label: "Tech" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "travel", label: "Travel" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

type Props = {
  workspaceSlug: string;
  workspace: {
    name: string;
    slug: string;
    category: string;
    description: string | null;
  };
};

export function SettingsForm({ workspaceSlug, workspace }: Props) {
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [category, setCategory] = useState(workspace.category);
  const [description, setDescription] = useState(workspace.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges =
    name !== workspace.name ||
    category !== workspace.category ||
    description !== (workspace.description ?? "");

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateWorkspace(workspaceSlug, { name, category, description });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border px-6 py-5">
        <h2 className="text-sm font-semibold">Workspace details</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Update your workspace name, category, and description.
        </p>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workspace name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs">Category</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your brand or team..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Slug: <span className="font-mono">{workspace.slug}</span>
            </p>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving || !name.trim()}
              size="sm"
              className="gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saved && <Check className="h-3.5 w-3.5" />}
              {saved ? "Saved" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
