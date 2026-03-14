const LOGO_PATTERNS = ["logo", "brand-mark", "brandmark", "wordmark"];
const EXCLUDE_PATTERNS = ["favicon"];

/**
 * Heuristic: returns true if the filename likely represents a brand logo.
 * Only meaningful when the file's mimeType starts with `image/`.
 */
export function isLikelyLogo(fileName: string): boolean {
  const lower = fileName.toLowerCase();

  if (EXCLUDE_PATTERNS.some((p) => lower.includes(p))) {
    return false;
  }

  return LOGO_PATTERNS.some((p) => lower.includes(p));
}
