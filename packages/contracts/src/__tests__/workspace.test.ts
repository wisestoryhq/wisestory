import { describe, it, expect } from "vitest";
import { createWorkspaceSchema, updateWorkspaceSchema } from "../workspace";

describe("createWorkspaceSchema", () => {
  it("accepts valid input", () => {
    const result = createWorkspaceSchema.safeParse({
      name: "Acme Corp",
      category: "tech",
    });
    expect(result.success).toBe(true);
  });

  it("accepts full input with all fields", () => {
    const result = createWorkspaceSchema.safeParse({
      name: "Acme Corp",
      category: "fashion",
      description: "A fashion brand workspace",
      logo: "https://example.com/logo.png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createWorkspaceSchema.safeParse({
      name: "",
      category: "tech",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = createWorkspaceSchema.safeParse({
      name: "Test",
      category: "invalid_category",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = createWorkspaceSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    const result = createWorkspaceSchema.safeParse({
      name: "a".repeat(101),
      category: "tech",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateWorkspaceSchema", () => {
  it("accepts partial updates", () => {
    const result = updateWorkspaceSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no changes)", () => {
    const result = updateWorkspaceSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts null description (clear field)", () => {
    const result = updateWorkspaceSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });
});
