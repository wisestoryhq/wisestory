import { describe, it, expect } from "vitest";
import { CAMPAIGN_STATUSES } from "../campaign";
import type { OutputPart } from "../campaign";

describe("CAMPAIGN_STATUSES", () => {
  it("contains all expected statuses", () => {
    expect(CAMPAIGN_STATUSES).toEqual([
      "draft",
      "generating",
      "completed",
      "failed",
    ]);
  });
});

describe("OutputPart type", () => {
  it("accepts text parts", () => {
    const part: OutputPart = { type: "text", content: "Hello world" };
    expect(part.type).toBe("text");
    expect(part.content).toBe("Hello world");
  });

  it("accepts image parts", () => {
    const part: OutputPart = {
      type: "image",
      url: "https://example.com/img.png",
      mimeType: "image/png",
    };
    expect(part.type).toBe("image");
    expect(part.url).toBe("https://example.com/img.png");
  });

  it("accepts image parts with alt text", () => {
    const part: OutputPart = {
      type: "image",
      url: "https://example.com/img.png",
      mimeType: "image/png",
      alt: "A brand hero image",
    };
    expect(part.alt).toBe("A brand hero image");
  });
});
