import { describe, it, expect } from "vitest";
import { buildGraphNarrative } from "../tools/traverse-graph.js";

function makeNode(overrides: Partial<Parameters<typeof buildGraphNarrative>[0][0]> = {}) {
  return {
    id: overrides.id ?? `node-${Math.random().toString(36).slice(2)}`,
    nodeType: overrides.nodeType ?? "concept",
    title: overrides.title ?? "Test Node",
    content: overrides.content ?? "Test content",
    imageData: overrides.imageData ?? null,
    imageMimeType: overrides.imageMimeType ?? null,
    metadata: overrides.metadata ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    outgoingEdges: overrides.outgoingEdges ?? [],
    incomingEdges: overrides.incomingEdges ?? [],
  };
}

describe("buildGraphNarrative", () => {
  it("returns empty string for empty nodes", () => {
    expect(buildGraphNarrative([], new Set())).toBe("");
  });

  it("includes decisions in Key Decisions section", () => {
    const nodes = [
      makeNode({ nodeType: "decision", title: "Use warm palette", content: "Warm colors for brand" }),
    ];
    const result = buildGraphNarrative(nodes, new Set());
    expect(result).toContain("### Key Decisions");
    expect(result).toContain("Use warm palette");
  });

  it("includes visual and copy direction", () => {
    const nodes = [
      makeNode({ nodeType: "visual_direction", title: "Bold typography", content: "Use large fonts" }),
      makeNode({ nodeType: "copy_direction", title: "Casual tone", content: "Friendly language" }),
    ];
    const result = buildGraphNarrative(nodes, new Set());
    expect(result).toContain("### Creative Direction");
    expect(result).toContain("[Visual] Bold typography");
    expect(result).toContain("[Copy] Casual tone");
  });

  it("excludes rejected_option nodes", () => {
    const nodes = [
      makeNode({ nodeType: "concept", title: "Good idea", content: "Keep this" }),
      makeNode({ nodeType: "rejected_option", title: "Bad idea", content: "Skip this" }),
    ];
    const result = buildGraphNarrative(nodes, new Set());
    expect(result).toContain("Good idea");
    expect(result).not.toContain("Bad idea");
  });

  it("excludes user-rejected images", () => {
    const nodes = [
      makeNode({
        nodeType: "liked_image",
        title: "Good image",
        content: "Approved",
        imageData: "good-data",
      }),
      makeNode({
        nodeType: "liked_image",
        title: "Bad image",
        content: "Rejected by user",
        imageData: "bad-data",
      }),
    ];
    const result = buildGraphNarrative(nodes, new Set(["bad-data"]));
    expect(result).toContain("Good image");
    expect(result).not.toContain("Bad image");
  });

  it("marks replaced nodes and shows evolution", () => {
    const oldNode = makeNode({
      id: "old",
      nodeType: "concept",
      title: "Original idea",
      content: "First draft",
    });
    const newNode = makeNode({
      id: "new",
      nodeType: "concept",
      title: "Better idea",
      content: "Refined version",
      outgoingEdges: [
        { relationshipType: "replaces", weight: 1, target: { id: "old", title: "Original idea" } },
      ],
    });
    const result = buildGraphNarrative([oldNode, newNode], new Set());
    expect(result).toContain("Better idea");
    expect(result).toContain("Creative Evolution");
    expect(result).toContain("Original idea");
  });

  it("shows reasoning chains for decisions", () => {
    const concept = makeNode({
      id: "concept-1",
      nodeType: "concept",
      title: "Warm colors",
      content: "Use warm tones",
      outgoingEdges: [
        { relationshipType: "leads_to", weight: 1, target: { id: "decision-1", title: "Use sunset palette" } },
      ],
    });
    const decision = makeNode({
      id: "decision-1",
      nodeType: "decision",
      title: "Use sunset palette",
      content: "Final color decision",
      incomingEdges: [
        { relationshipType: "leads_to", weight: 1, source: { id: "concept-1", title: "Warm colors" } },
      ],
    });
    const result = buildGraphNarrative([concept, decision], new Set());
    expect(result).toContain("Use sunset palette");
    expect(result).toContain("Reasoning");
    expect(result).toContain("Warm colors");
  });

  it("shows support relationships", () => {
    const supporter = makeNode({
      id: "s1",
      nodeType: "brand_element",
      title: "Brand guidelines",
      content: "Gold accent required",
    });
    const decision = makeNode({
      id: "d1",
      nodeType: "decision",
      title: "Use gold accents",
      content: "Aligned with brand",
      incomingEdges: [
        { relationshipType: "supports", weight: 1, source: { id: "s1", title: "Brand guidelines" } },
      ],
    });
    const result = buildGraphNarrative([supporter, decision], new Set());
    expect(result).toContain("Supported by: Brand guidelines");
  });

  it("scores connected nodes higher (appear first)", () => {
    const isolated = makeNode({
      nodeType: "concept",
      title: "Isolated idea",
      content: "No connections",
    });
    const connected = makeNode({
      id: "connected",
      nodeType: "concept",
      title: "Central idea",
      content: "Many connections",
      outgoingEdges: [
        { relationshipType: "leads_to", weight: 1, target: { id: "x", title: "X" } },
        { relationshipType: "supports", weight: 1, target: { id: "y", title: "Y" } },
      ],
      incomingEdges: [
        { relationshipType: "refines", weight: 1, source: { id: "z", title: "Z" } },
      ],
    });
    const result = buildGraphNarrative([isolated, connected], new Set());
    // Central idea should appear before isolated one
    const centralIdx = result.indexOf("Central idea");
    const isolatedIdx = result.indexOf("Isolated idea");
    expect(centralIdx).toBeLessThan(isolatedIdx);
  });
});
