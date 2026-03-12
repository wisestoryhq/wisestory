import type { MediaType } from "./media-type";

export const CAMPAIGN_STATUSES = [
  "draft",
  "generating",
  "completed",
  "failed",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export interface Campaign {
  id: string;
  mediaType: MediaType;
  prompt: string;
  instructions: string | null;
  status: CampaignStatus;
  workspaceId: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A single part of an interleaved Gemini response */
export type OutputPart =
  | { type: "text"; content: string }
  | { type: "image"; url: string; mimeType: string; alt?: string };

export interface CampaignOutput {
  id: string;
  version: number;
  parts: OutputPart[];
  campaignId: string;
  createdAt: Date;
}

export interface GenerationSourceRef {
  id: string;
  campaignId: string;
  knowledgeChunkId: string;
  fileName: string;
  driveUrl: string | null;
}
