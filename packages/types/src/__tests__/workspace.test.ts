import { describe, it, expect } from "vitest";
import { WORKSPACE_CATEGORIES, WORKSPACE_MEMBER_ROLES } from "../workspace";

describe("WORKSPACE_CATEGORIES", () => {
  it("contains expected categories", () => {
    expect(WORKSPACE_CATEGORIES).toContain("news");
    expect(WORKSPACE_CATEGORIES).toContain("fashion");
    expect(WORKSPACE_CATEGORIES).toContain("tech");
    expect(WORKSPACE_CATEGORIES).toContain("other");
  });

  it("has 10 categories", () => {
    expect(WORKSPACE_CATEGORIES).toHaveLength(10);
  });
});

describe("WORKSPACE_MEMBER_ROLES", () => {
  it("contains owner, admin, member", () => {
    expect(WORKSPACE_MEMBER_ROLES).toEqual(["owner", "admin", "member"]);
  });
});
