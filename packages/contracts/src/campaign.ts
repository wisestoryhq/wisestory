import { z } from "zod";
import { MEDIA_TYPES } from "@wisestory/types";

export const generateCampaignSchema = z.object({
  mediaType: z.enum(MEDIA_TYPES),
  prompt: z.string().min(1).max(5000),
  instructions: z.string().max(2000).optional(),
});

export type GenerateCampaignInput = z.infer<typeof generateCampaignSchema>;

export const outputPartSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    content: z.string(),
  }),
  z.object({
    type: z.literal("image"),
    url: z.string().url().optional(),
    data: z.string().optional(),
    mimeType: z.string(),
    alt: z.string().optional(),
  }),
]);

export type OutputPartSchema = z.infer<typeof outputPartSchema>;

export const campaignOutputSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  parts: z.array(outputPartSchema),
  campaignId: z.string(),
  createdAt: z.string().datetime(),
});

export type CampaignOutputSchema = z.infer<typeof campaignOutputSchema>;

export const generationResponseSchema = z.object({
  campaign: z.object({
    id: z.string(),
    mediaType: z.enum(MEDIA_TYPES),
    status: z.enum(["draft", "briefing", "generating_doc", "completed", "failed"]),
  }),
  output: campaignOutputSchema,
  sourceRefs: z.array(
    z.object({
      fileName: z.string(),
      driveUrl: z.string().url().nullable(),
    })
  ),
});

export type GenerationResponse = z.infer<typeof generationResponseSchema>;
