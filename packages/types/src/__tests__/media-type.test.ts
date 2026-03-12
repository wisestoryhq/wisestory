import { describe, it, expect } from "vitest";
import { MEDIA_TYPES, MEDIA_TYPE_LABELS } from "../media-type";

describe("MEDIA_TYPES", () => {
  it("contains all 7 media types", () => {
    expect(MEDIA_TYPES).toHaveLength(7);
  });

  it("includes all expected values", () => {
    expect(MEDIA_TYPES).toContain("instagram_post");
    expect(MEDIA_TYPES).toContain("instagram_carousel");
    expect(MEDIA_TYPES).toContain("instagram_reel");
    expect(MEDIA_TYPES).toContain("tiktok_video");
    expect(MEDIA_TYPES).toContain("youtube_shorts");
    expect(MEDIA_TYPES).toContain("youtube_video");
    expect(MEDIA_TYPES).toContain("multi_platform_campaign");
  });
});

describe("MEDIA_TYPE_LABELS", () => {
  it("has a label for every media type", () => {
    for (const type of MEDIA_TYPES) {
      expect(MEDIA_TYPE_LABELS[type]).toBeDefined();
      expect(typeof MEDIA_TYPE_LABELS[type]).toBe("string");
      expect(MEDIA_TYPE_LABELS[type].length).toBeGreaterThan(0);
    }
  });
});
