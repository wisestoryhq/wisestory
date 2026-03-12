import { describe, it, expect } from "vitest";
import {
  generateCampaignSchema,
  outputPartSchema,
  campaignOutputSchema,
} from "../campaign";

describe("generateCampaignSchema", () => {
  it("accepts valid generation request", () => {
    const result = generateCampaignSchema.safeParse({
      mediaType: "instagram_post",
      prompt: "Create a launch announcement for our new coffee blend",
      projectId: "proj_123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts request with instructions", () => {
    const result = generateCampaignSchema.safeParse({
      mediaType: "youtube_shorts",
      prompt: "Make a short about our founder story",
      instructions: "Keep it casual and authentic",
      projectId: "proj_456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty prompt", () => {
    const result = generateCampaignSchema.safeParse({
      mediaType: "instagram_post",
      prompt: "",
      projectId: "proj_123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid media type", () => {
    const result = generateCampaignSchema.safeParse({
      mediaType: "twitter_post",
      prompt: "Some prompt",
      projectId: "proj_123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing projectId", () => {
    const result = generateCampaignSchema.safeParse({
      mediaType: "instagram_post",
      prompt: "Some prompt",
    });
    expect(result.success).toBe(false);
  });
});

describe("outputPartSchema", () => {
  it("accepts text part", () => {
    const result = outputPartSchema.safeParse({
      type: "text",
      content: "Welcome to our brand",
    });
    expect(result.success).toBe(true);
  });

  it("accepts image part", () => {
    const result = outputPartSchema.safeParse({
      type: "image",
      url: "https://storage.example.com/img.png",
      mimeType: "image/png",
    });
    expect(result.success).toBe(true);
  });

  it("accepts image part with alt", () => {
    const result = outputPartSchema.safeParse({
      type: "image",
      url: "https://storage.example.com/img.png",
      mimeType: "image/png",
      alt: "Hero banner",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown type", () => {
    const result = outputPartSchema.safeParse({
      type: "video",
      url: "https://example.com/vid.mp4",
    });
    expect(result.success).toBe(false);
  });

  it("rejects text part without content", () => {
    const result = outputPartSchema.safeParse({ type: "text" });
    expect(result.success).toBe(false);
  });
});

describe("campaignOutputSchema", () => {
  it("accepts valid output with interleaved parts", () => {
    const result = campaignOutputSchema.safeParse({
      id: "out_001",
      version: 1,
      parts: [
        { type: "text", content: "Here is your Instagram post concept:" },
        {
          type: "image",
          url: "https://storage.example.com/hero.png",
          mimeType: "image/png",
          alt: "Hero image",
        },
        { type: "text", content: "Caption: Discover the new blend..." },
      ],
      campaignId: "camp_001",
      createdAt: "2026-03-12T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects output with invalid parts", () => {
    const result = campaignOutputSchema.safeParse({
      id: "out_001",
      version: 1,
      parts: [{ type: "invalid" }],
      campaignId: "camp_001",
      createdAt: "2026-03-12T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});
