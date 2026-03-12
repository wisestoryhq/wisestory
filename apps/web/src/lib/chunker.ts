/**
 * Split text into overlapping chunks of roughly `maxChars` characters,
 * breaking on paragraph or sentence boundaries when possible.
 */
export function chunkText(
  text: string,
  maxChars = 1500,
  overlap = 200,
): string[] {
  if (!text || text.trim().length === 0) return [];
  if (text.length <= maxChars) return [text.trim()];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChars;

    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }

    // Try to break at a paragraph boundary
    const paragraphBreak = text.lastIndexOf("\n\n", end);
    if (paragraphBreak > start + maxChars / 2) {
      end = paragraphBreak;
    } else {
      // Try sentence boundary
      const sentenceBreak = text.lastIndexOf(". ", end);
      if (sentenceBreak > start + maxChars / 2) {
        end = sentenceBreak + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks.filter((c) => c.length > 0);
}
