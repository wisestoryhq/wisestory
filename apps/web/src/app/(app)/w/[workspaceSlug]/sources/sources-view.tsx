"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HardDrive,
  FolderOpen,
  Check,
  Loader2,
  ExternalLink,
  FileText,
} from "lucide-react";

type Folder = {
  id: string;
  name: string;
};

type Connection = {
  id: string;
  status: string;
  folderIds: string[];
  fileCount: number;
  connectedAt: string;
};

type SourcesViewProps = {
  workspaceSlug: string;
  connection: Connection | null;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  connected: { label: "Connected", color: "bg-green-100 text-green-800" },
  syncing: { label: "Syncing", color: "bg-yellow-100 text-yellow-800" },
  error: { label: "Error", color: "bg-red-100 text-red-800" },
  disconnected: {
    label: "Disconnected",
    color: "bg-muted text-muted-foreground",
  },
};

export function SourcesView({ workspaceSlug, connection }: SourcesViewProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    connection?.folderIds ?? [],
  );
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    connection &&
    JSON.stringify(selectedIds.sort()) !==
      JSON.stringify([...(connection.folderIds ?? [])].sort());

  const loadFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const res = await fetch(
        `/api/drive/folders?workspace=${workspaceSlug}`,
      );
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders);
      }
    } finally {
      setLoadingFolders(false);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    if (connection?.status === "connected") {
      loadFolders();
    }
  }, [connection?.status, loadFolders]);

  function toggleFolder(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

  async function saveFolders() {
    setSaving(true);
    try {
      await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceSlug, folderIds: selectedIds }),
      });
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-8 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect external sources to build your workspace knowledge base.
          </p>
        </div>

        {/* Not connected */}
        {!connection && (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">
              Connect Google Drive
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              Link your Google Drive to import brand assets, guidelines, and
              content that the AI will use to generate grounded stories.
            </p>
            <Button asChild size="sm" className="mt-6 gap-1.5">
              <a href={`/api/drive/connect?workspace=${workspaceSlug}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                Connect Google Drive
              </a>
            </Button>
          </div>
        )}

        {/* Connected */}
        {connection && (
          <div className="space-y-6">
            {/* Status card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Google Drive</CardTitle>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${statusLabels[connection.status]?.color ?? ""}`}
                  >
                    {statusLabels[connection.status]?.label ??
                      connection.status}
                  </Badge>
                </div>
                <CardDescription>
                  {connection.folderIds.length} folder
                  {connection.folderIds.length !== 1 ? "s" : ""} selected
                  {" · "}
                  {connection.fileCount} file
                  {connection.fileCount !== 1 ? "s" : ""} indexed
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Folder browser */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Select folders</h2>
                {hasChanges && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={saveFolders}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Save selection
                  </Button>
                )}
              </div>

              {loadingFolders && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loadingFolders && folders.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <FolderOpen className="mx-auto h-5 w-5 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No folders found in your Drive root.
                  </p>
                </div>
              )}

              {!loadingFolders && folders.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {folders.map((folder) => {
                    const selected = selectedIds.includes(folder.id);
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => toggleFolder(folder.id)}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-foreground/20"
                        }`}
                      >
                        <FolderOpen
                          className={`h-4 w-4 shrink-0 ${
                            selected
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`truncate text-sm ${
                            selected ? "font-medium text-primary" : ""
                          }`}
                        >
                          {folder.name}
                        </span>
                        {selected && (
                          <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
