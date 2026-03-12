"use client";

import { useState, useCallback } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HardDrive,
  FolderOpen,
  Plus,
  ExternalLink,
  X,
} from "lucide-react";

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

declare global {
  interface Window {
    gapi: {
      load(api: string, callback: () => void): void;
    };
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
  const [saving, setSaving] = useState(false);

  const hasChanges =
    connection &&
    JSON.stringify(selectedFolders.map((f) => f.id).sort()) !==
      JSON.stringify([...(connection.folderIds ?? [])].sort());

  const openPicker = useCallback(async () => {
    // Get a fresh access token
    const res = await fetch(
      `/api/drive/token?workspace=${workspaceSlug}`,
    );
    if (!res.ok) return;
    const { accessToken } = await res.json();

    const google = window.google;
    if (!google?.picker) return;

    const view = new (
      google.picker.ViewId.FOLDERS as unknown as new () => GooglePickerView
    )();

    const docsView = Object.assign(
      Object.create(Object.getPrototypeOf(view)),
      view,
    );
    docsView.setMimeTypes?.("application/vnd.google-apps.folder");
    docsView.setSelectFolderEnabled?.(true);

    const picker = new google.picker.PickerBuilder()
      .setOAuthToken(accessToken)
      .setAppId(googleClientId.split("-")[0])
      .setCallback((data: GooglePickerResult) => {
        if (data.action === google.picker.Action.PICKED && data.docs) {
          const newFolders = data.docs.map((doc) => ({
            id: doc.id,
            name: doc.name,
          }));
          setSelectedFolders((prev) => {
            const existingIds = new Set(prev.map((f) => f.id));
            const unique = newFolders.filter((f) => !existingIds.has(f.id));
            return [...prev, ...unique];
          });
        }
      })
      .addView(docsView)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setTitle("Select folders to index")
      .build();

    picker.setVisible(true);
  }, [workspaceSlug, googleClientId]);

  function removeFolder(id: string) {
    setSelectedFolders((prev) => prev.filter((f) => f.id !== id));
  }

  async function saveFolders() {
    setSaving(true);
    try {
      await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceSlug,
          folderIds: selectedFolders.map((f) => f.id),
          folderNames: selectedFolders.map((f) => f.name),
        }),
      });
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-8 py-10">
      {/* Load Google Picker API */}
      <Script
        src="https://apis.google.com/js/api.js"
        onLoad={() => {
          window.gapi.load("picker", () => setPickerReady(true));
        }}
      />

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
            <h2 className="text-base font-semibold">Connect Google Drive</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              Link your Google Drive to import brand assets, guidelines, and
              content that the AI will use to generate grounded stories.
            </p>
            <a href={`/api/drive/connect?workspace=${workspaceSlug}`}>
              <Button size="sm" className="mt-6 gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Connect Google Drive
              </Button>
            </a>
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
                  {selectedFolders.length} folder
                  {selectedFolders.length !== 1 ? "s" : ""} selected
                  {" · "}
                  {connection.fileCount} file
                  {connection.fileCount !== 1 ? "s" : ""} indexed
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Selected folders */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Selected folders</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={openPicker}
                    disabled={!pickerReady}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add folders
                  </Button>
                  {hasChanges && (
                    <Button
                      size="sm"
                      onClick={saveFolders}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  )}
                </div>
              </div>

              {selectedFolders.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <FolderOpen className="mx-auto h-5 w-5 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No folders selected. Click "Add folders" to pick folders
                    from your Google Drive.
                  </p>
                </div>
              )}

              {selectedFolders.length > 0 && (
                <div className="space-y-2">
                  {selectedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {folder.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFolder(folder.id)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
