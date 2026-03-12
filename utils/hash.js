import crypto from "crypto";

/**
 * Generate SHA-256 hash of journal text for cache key.
 */
export function hashText(text) {
  return crypto.createHash("sha256").update(text.trim()).digest("hex").slice(0, 16);
}
