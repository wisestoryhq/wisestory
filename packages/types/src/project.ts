import type { MediaType } from "./media-type";

export interface Project {
  id: string;
  name: string;
  brief: string | null;
  audience: string | null;
  platforms: MediaType[];
  notes: string | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}
