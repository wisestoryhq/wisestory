import { describe, it, expect } from "vitest";

// Test the hex color regex and inline formatting logic directly
// (Extracting the logic rather than importing the React component)

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?=\b|\s|[),;:'"}\]]|$)/g;
const INLINE_RE = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_)/g;

function findHexColors(text: string): string[] {
  HEX_COLOR_RE.lastIndex = 0;
  const matches: string[] = [];
  let m;
  while ((m = HEX_COLOR_RE.exec(text)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

function findInlineFormatting(text: string): string[] {
  INLINE_RE.lastIndex = 0;
  const matches: string[] = [];
  let m;
  while ((m = INLINE_RE.exec(text)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

describe("Hex color detection", () => {
  it("detects 6-digit hex colors", () => {
    expect(findHexColors("Use #FF5733 for warmth")).toEqual(["#FF5733"]);
  });

  it("detects 3-digit hex colors", () => {
    expect(findHexColors("Short #FFF white")).toEqual(["#FFF"]);
  });

  it("detects 8-digit hex colors (with alpha)", () => {
    expect(findHexColors("Semi-transparent #FF573380")).toEqual(["#FF573380"]);
  });

  it("detects multiple colors in one line", () => {
    expect(findHexColors("Primary #f6b900, secondary #1a1a1a")).toEqual([
      "#f6b900",
      "#1a1a1a",
    ]);
  });

  it("does not match invalid hex", () => {
    expect(findHexColors("Not a color #GGG or #12")).toEqual([]);
  });

  it("detects colors at end of string", () => {
    expect(findHexColors("Brand color is #f6b900")).toEqual(["#f6b900"]);
  });

  it("detects colors before punctuation", () => {
    expect(findHexColors("Use #f6b900, #333333.")).toEqual(["#f6b900", "#333333"]);
  });
});

describe("Inline markdown formatting", () => {
  it("detects bold text", () => {
    expect(findInlineFormatting("This is **bold** text")).toEqual(["**bold**"]);
  });

  it("detects italic text", () => {
    expect(findInlineFormatting("This is *italic* text")).toEqual(["*italic*"]);
  });

  it("detects bold+italic text", () => {
    expect(findInlineFormatting("This is ***bolditalic*** text")).toEqual([
      "***bolditalic***",
    ]);
  });

  it("detects underscore bold", () => {
    expect(findInlineFormatting("This is __bold__ text")).toEqual(["__bold__"]);
  });

  it("detects underscore italic", () => {
    expect(findInlineFormatting("This is _italic_ text")).toEqual(["_italic_"]);
  });

  it("detects multiple formats", () => {
    const result = findInlineFormatting("**Bold** and *italic* together");
    expect(result).toEqual(["**Bold**", "*italic*"]);
  });
});
