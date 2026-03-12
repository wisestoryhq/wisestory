import { z } from "zod";
import { WORKSPACE_CATEGORIES } from "@wisestory/types";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(WORKSPACE_CATEGORIES),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(WORKSPACE_CATEGORIES).optional(),
  description: z.string().max(500).nullable().optional(),
  logo: z.string().url().nullable().optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
