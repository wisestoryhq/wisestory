import { describe, it, expect } from "vitest";
import { createProjectSchema, updateProjectSchema } from "../project";

describe("createProjectSchema", () => {
  it("accepts valid minimal input", () => {
    const result = createProjectSchema.safeParse({ name: "Spring Launch" });
    expect(result.success).toBe(true);
  });

  it("accepts full input", () => {
    const result = createProjectSchema.safeParse({
      name: "Spring Launch 2026",
      brief: "Launch campaign for new product line",
      audience: "Gen Z fashion enthusiasts",
      platforms: ["instagram_post", "tiktok_video", "youtube_shorts"],
      notes: "Focus on vibrant colors",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid platform", () => {
    const result = createProjectSchema.safeParse({
      name: "Test",
      platforms: ["invalid_platform"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty platforms array", () => {
    const result = createProjectSchema.safeParse({
      name: "Test",
      platforms: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("updateProjectSchema", () => {
  it("accepts partial updates", () => {
    const result = updateProjectSchema.safeParse({
      audience: "Millennials",
    });
    expect(result.success).toBe(true);
  });

  it("accepts clearing a field with null", () => {
    const result = updateProjectSchema.safeParse({ brief: null });
    expect(result.success).toBe(true);
  });
});
