import { z } from "zod";
import { MEDIA_TYPES } from "@wisestory/types";

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  brief: z.string().max(2000).optional(),
  audience: z.string().max(500).optional(),
  platforms: z.array(z.enum(MEDIA_TYPES)).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  brief: z.string().max(2000).nullable().optional(),
  audience: z.string().max(500).nullable().optional(),
  platforms: z.array(z.enum(MEDIA_TYPES)).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
