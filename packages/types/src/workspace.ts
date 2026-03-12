export const WORKSPACE_CATEGORIES = [
  "news",
  "fashion",
  "cooking",
  "gaming",
  "tech",
  "health",
  "education",
  "travel",
  "entertainment",
  "other",
] as const;

export type WorkspaceCategory = (typeof WORKSPACE_CATEGORIES)[number];

export const WORKSPACE_MEMBER_ROLES = ["owner", "admin", "member"] as const;

export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[number];

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  category: WorkspaceCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceMemberRole;
  userId: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}
