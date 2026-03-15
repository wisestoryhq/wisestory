"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import {
  FolderOpen,
  Plus,
  ExternalLink,
  X,
  Loader2,
  RefreshCw,
  FileText,
  Sparkles,
  Check,
  ArrowRight,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function DriveIcon({ size = 20 }: { size?: number }) {
  return (
    <Image
      src="/icons/google-drive.png"
      alt="Google Drive"
      width={size}
      height={size}
      className="shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

type SelectedFolder = {
  id: string;
  name: string;
};

type Connection = {
  id: string;
  status: string;
  folderIds: string[];
  folderNames: string[];
  fileCount: number;
  connectedAt: string;
};

type SourcesViewProps = {
  workspaceSlug: string;
  connection: Connection | null;
  googleClientId: string;
  campaignCount: number;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  connected: { label: "Connected", color: "bg-green-100 text-green-800" },
  syncing: { label: "Indexing", color: "bg-yellow-100 text-yellow-800" },
  error: { label: "Error", color: "bg-red-100 text-red-800" },
  disconnected: { label: "Not connected", color: "bg-muted text-muted-foreground" },
};

declare global {
  interface Window {
    gapi: { load(api: string, callback: () => void): void };
    google: {
      picker: {
        PickerBuilder: new () => GooglePickerBuilder;
        ViewId: { FOLDERS: string };
        Feature: { MULTISELECT_ENABLED: string };
        Action: { PICKED: string; CANCEL: string };
        DocsViewMode: { LIST: string };
      };
    };
  }
}

interface GooglePickerBuilder {
  setOAuthToken(token: string): GooglePickerBuilder;
  setDeveloperKey(key: string): GooglePickerBuilder;
  setAppId(appId: string): GooglePickerBuilder;
  setCallback(callback: (data: GooglePickerResult) => void): GooglePickerBuilder;
  addView(view: GooglePickerView): GooglePickerBuilder;
  enableFeature(feature: string): GooglePickerBuilder;
  setTitle(title: string): GooglePickerBuilder;
  build(): { setVisible(visible: boolean): void };
}

interface GooglePickerView {
  setMimeTypes(mimeTypes: string): GooglePickerView;
  setMode(mode: string): GooglePickerView;
  setSelectFolderEnabled(enabled: boolean): GooglePickerView;
}

interface GooglePickerResult {
  action: string;
  docs?: Array<{ id: string; name: string; mimeType: string }>;
}

export function SourcesView({
  workspaceSlug,
  connection,
  googleClientId,
  campaignCount,
}: SourcesViewProps) {
  const [selectedFolders, setSelectedFolders] = useState<SelectedFolder[]>(
    () => {
      if (!connection) return [];
      return connection.folderIds.map((id, i) => ({
        id,
        name: connection.folderNames[i] ?? id,
      }));
    },
  );
  const [pickerReady, setPickerReady] = useState(false);
  const [indexing, setIndexing] = useState(connection?.status === "syncing");
  const [connectionStatus, setConnectionStatus] = useState(
    connection?.status ?? "disconnected",
  );
  const [fileCount, setFileCount] = useState(connection?.fileCount ?? 0);
  const [indexStatus, setIndexStatus] = useState<{
    totalFiles: number;
    files: Record<string, number>;
    chunks: number;
  } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save folders AND start indexing in one shot
  const saveAndIndex = useCallback(
    async (folders: SelectedFolder[]) => {
      // Save folders
      await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSlug,
          folderIds: folders.map((f) => f.id),
          folderNames: folders.map((f) => f.name),
        }),
      });

      // Immediately start indexing
      setIndexing(true);
      setConnectionStatus("syncing");
      await fetch("/api/drive/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceSlug }),
      });
    },
    [workspaceSlug],
  );

  // Track pending folders from picker to trigger save+index via effect
  const pendingFoldersRef = useRef<SelectedFolder[] | null>(null);

  useEffect(() => {
    if (pendingFoldersRef.current) {
      const folders = pendingFoldersRef.current;
      pendingFoldersRef.current = null;
      saveAndIndex(folders);
    }
  });

  const openPicker = useCallback(async () => {
    const res = await fetch(`/api/drive/token?workspace=${workspaceSlug}`);
    if (!res.ok) return;
    const { accessToken } = await res.json();

    const gPicker = window.google.picker;
    if (!gPicker) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gp = gPicker as any;
    const view = new gp.DocsView(gp.ViewId.FOLDERS);
    view.setSelectFolderEnabled(true);

    const picker = new gp.PickerBuilder()
      .setOAuthToken(accessToken)
      .setAppId(googleClientId.split("-")[0])
      .setCallback((data: GooglePickerResult) => {
        if (data.action === gp.Action.PICKED && data.docs) {
          const newFolders = data.docs.map(
            (doc: { id: string; name: string }) => ({
              id: doc.id,
              name: doc.name,
            }),
          );
          setSelectedFolders((prev) => {
            const existingIds = new Set(prev.map((f) => f.id));
            const unique = newFolders.filter(
              (f: { id: string }) => !existingIds.has(f.id),
            );
            if (unique.length === 0) return prev;
            const updated = [...prev, ...unique];
            // Schedule save+index for next render (outside state updater)
            pendingFoldersRef.current = updated;
            return updated;
          });
        }
      })
      .addView(view)
      .enableFeature(gp.Feature.MULTISELECT_ENABLED)
      .setTitle("Select folders to index")
      .build();

    picker.setVisible(true);
  }, [workspaceSlug, googleClientId]);

  function removeFolder(id: string) {
    setSelectedFolders((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      // Auto-save when removing
      fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSlug,
          folderIds: updated.map((f) => f.id),
          folderNames: updated.map((f) => f.name),
        }),
      });
      // Reset counts immediately
      setFileCount(0);
      setIndexStatus(null);
      return updated;
    });
  }

  const pollStatus = useCallback(async () => {
    const res = await fetch(`/api/drive/status?workspace=${workspaceSlug}`);
    if (!res.ok) return;
    const data = await res.json();
    setIndexStatus({
      totalFiles: data.totalFiles,
      files: data.files,
      chunks: data.chunks,
    });
    setConnectionStatus(data.status);
    setFileCount(data.totalFiles);
    if (data.status !== "syncing") {
      setIndexing(false);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [workspaceSlug]);

  useEffect(() => {
    if (indexing) {
      pollStatus();
      pollRef.current = setInterval(pollStatus, 2000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [indexing, pollStatus]);

  async function startIndexing() {
    setIndexing(true);
    setConnectionStatus("syncing");
    await fetch("/api/drive/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceSlug }),
    });
  }

  const [showDisconnect, setShowDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    await fetch("/api/drive/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceSlug }),
    });
    window.location.reload();
  }

  const isIndexed = fileCount > 0 && !indexing && connectionStatus === "connected";

  return (
    <div className="px-8 py-10">
      <Script
        src="https://apis.google.com/js/api.js"
        onLoad={() => {
          window.gapi.load("picker", () => setPickerReady(true));
        }}
      />

      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your Google Drive to build a knowledge base for AI-powered
            content generation.
          </p>
        </div>

        {/* Not connected — single CTA */}
        {!connection && (
          <div className="overflow-hidden rounded-2xl border">
            <div className="bg-muted/30 px-8 py-12 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f6b900]/10 ring-1 ring-[#f6b900]/20">
                <DriveIcon size={24} />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">
                Connect Google Drive
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Link your Google Drive to import brand assets, guidelines, and
                content. The AI uses these to generate grounded, on-brand
                stories.
              </p>
              <a href={`/api/drive/connect?workspace=${workspaceSlug}`}>
                <Button className="mt-6 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Connect Google Drive
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Connected */}
        {connection && (
          <div className="space-y-4">
            {/* Connection header */}
            <div className="flex items-center justify-between rounded-xl border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f6b900]/10">
                  <DriveIcon size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Google Drive</span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${statusConfig[connectionStatus]?.color ?? ""}`}
                    >
                      {indexing && (
                        <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
                      )}
                      {statusConfig[connectionStatus]?.label ?? connectionStatus}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedFolders.length} folder
                    {selectedFolders.length !== 1 ? "s" : ""}
                    {fileCount > 0 && (
                      <>
                        {" · "}
                        {fileCount} file{fileCount !== 1 ? "s" : ""} indexed
                      </>
                    )}
                    {indexStatus?.chunks ? (
                      <> · {indexStatus.chunks} chunks</>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isIndexed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground"
                    onClick={startIndexing}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Re-index
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={openPicker}
                  disabled={!pickerReady || indexing}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add folders
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive whitespace-nowrap"
                      onClick={() => setShowDisconnect(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Folders list */}
            {selectedFolders.length === 0 ? (
              <button
                onClick={openPicker}
                disabled={!pickerReady}
                className="w-full rounded-xl border border-dashed p-8 text-center transition-colors hover:border-[#f6b900]/40 hover:bg-[#f6b900]/[0.02]"
              >
                <FolderOpen className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">
                  Select folders to index
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick folders from your Google Drive — indexing starts
                  automatically
                </p>
              </button>
            ) : (
              <div className="divide-y rounded-xl border">
                {selectedFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-4 w-4 text-[#f6b900]" />
                      <span className="text-sm font-medium">{folder.name}</span>
                    </div>
                    <button
                      onClick={() => removeFolder(folder.id)}
                      disabled={indexing}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Indexing progress */}
            {indexing && indexStatus && (
              <div className="rounded-xl border bg-muted/20 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[#f6b900]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Indexing files from Google Drive...
                    </p>
                    <div className="mt-2 flex gap-5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3" />
                        {indexStatus.files.indexed ?? 0}/{indexStatus.totalFiles}{" "}
                        files
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" />
                        {indexStatus.chunks} chunks
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[#f6b900] transition-all duration-500"
                        style={{
                          width: `${indexStatus.totalFiles > 0 ? ((indexStatus.files.indexed ?? 0) / indexStatus.totalFiles) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Indexed success state */}
            {isIndexed && !indexStatus && (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-900/30 dark:bg-green-950/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Knowledge base ready
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Your brand assets are indexed and ready for content
                    generation.
                  </p>
                </div>
              </div>
            )}

            {/* First campaign CTA */}
            {isIndexed && campaignCount === 0 && (
              <Link
                href={`/w/${workspaceSlug}/campaigns/new`}
                className="flex items-center justify-between rounded-xl border border-[#f6b900]/30 bg-[#f6b900]/[0.04] px-5 py-4 transition-colors hover:bg-[#f6b900]/[0.08]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f6b900]/10">
                    <Sparkles className="h-4 w-4 text-[#f6b900]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      Create your first campaign
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your knowledge base is ready — start generating on-brand content
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#f6b900]" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Disconnect confirmation dialog */}
      <Dialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Google Drive?</DialogTitle>
            <DialogDescription>
              This will remove the Google Drive connection and delete all indexed
              files and knowledge chunks for this workspace. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnect(false)}
              disabled={disconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="gap-1.5"
            >
              {disconnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
