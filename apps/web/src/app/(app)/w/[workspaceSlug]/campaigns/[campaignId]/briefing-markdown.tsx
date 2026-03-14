import React from "react";

/**
 * Shared markdown renderer for briefing content.
 * Used by both the streaming view (BriefingDocStream) and the
 * completed view (BriefingDocument) so they render identically.
 *
 * Outputs semantic HTML meant to be wrapped in a Tailwind `prose` container.
 */

// Hex color regex: matches #RGB, #RRGGBB, #RRGGBBAA (3, 6, or 8 hex digits)
const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?=\b|\s|[),;:'"}\]]|$)/g;

// Inline formatting: bold+italic, bold, italic
const INLINE_RE =
  /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_)/g;

function renderInline(text: string): React.ReactNode {
  // First pass: split on hex colors, then apply inline formatting to each segment
  const segments: React.ReactNode[] = [];
  let cursor = 0;
  let colorMatch: RegExpExecArray | null;

  // Reset regex
  HEX_COLOR_RE.lastIndex = 0;

  while ((colorMatch = HEX_COLOR_RE.exec(text)) !== null) {
    // Text before this color
    if (colorMatch.index > cursor) {
      segments.push(...applyInlineFormatting(text.slice(cursor, colorMatch.index), cursor));
    }

    const hex = colorMatch[0];
    segments.push(
      <span
        key={`color-${colorMatch.index}`}
        className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 align-middle text-[0.8em] font-mono leading-none"
      >
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-[3px] border border-black/10"
          style={{ backgroundColor: hex }}
        />
        {hex}
      </span>
    );

    cursor = colorMatch.index + hex.length;
  }

  // Remaining text after last color (or all text if no colors)
  if (cursor < text.length) {
    segments.push(...applyInlineFormatting(text.slice(cursor), cursor));
  }

  return segments.length === 1 ? segments[0] : segments;
}

function applyInlineFormatting(text: string, keyOffset: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex
  INLINE_RE.lastIndex = 0;

  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const key = keyOffset + match.index;
    if (match[2]) {
      parts.push(<strong key={key}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      parts.push(<strong key={key}>{match[3]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={key}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(<strong key={key}>{match[5]}</strong>);
    } else if (match[6]) {
      parts.push(<em key={key}>{match[6]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function BriefingMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        if (trimmed.startsWith("### ")) {
          return <h3 key={i}>{renderInline(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith("## ")) {
          return <h2 key={i}>{renderInline(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith("# ")) {
          return <h1 key={i}>{renderInline(trimmed.slice(2))}</h1>;
        }

        if (trimmed === "---" || trimmed === "***") {
          return <hr key={i} />;
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <ul key={i}>
              <li>{renderInline(trimmed.slice(2))}</li>
            </ul>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          return (
            <ol key={i} start={Number(numberedMatch[1])}>
              <li>{renderInline(numberedMatch[2])}</li>
            </ol>
          );
        }

        return <p key={i}>{renderInline(trimmed)}</p>;
      })}
    </>
  );
}
