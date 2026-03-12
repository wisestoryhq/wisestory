export const SOURCE_CONNECTION_STATUSES = [
  "connected",
  "syncing",
  "error",
  "disconnected",
] as const;

export type SourceConnectionStatus =
  (typeof SOURCE_CONNECTION_STATUSES)[number];

export const SOURCE_FILE_STATUSES = [
  "pending",
  "processing",
  "indexed",
  "error",
] as const;

export type SourceFileStatus = (typeof SOURCE_FILE_STATUSES)[number];

export interface SourceConnection {
  id: string;
  provider: string;
  status: SourceConnectionStatus;
  folderIds: string[];
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SourceFile {
  id: string;
  externalId: string;
  name: string;
  mimeType: string;
  driveUrl: string | null;
  size: number | null;
  status: SourceFileStatus;
  workspaceId: string;
  sourceConnectionId: string;
  indexedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
