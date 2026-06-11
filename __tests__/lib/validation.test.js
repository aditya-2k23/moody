/**
 * __tests__/lib/validation.test.js
 *
 * Tests for the three validation helpers in lib/validation.js.
 *
 * WHY THIS TEST EXISTS:
 *   These functions gate every API route handler.  isChatIdScopedToUser() is
 *   the primary defence against horizontal privilege escalation (user A reading
 *   user B's chat).  isValidSessionId() and isValidString() prevent injection
 *   and malformed-input bugs.  Regressions here = security vulnerabilities, so
 *   thorough edge-case coverage is essential.
 *
 * COVERAGE:
 *   isChatIdScopedToUser  – correct prefix, wrong uid, missing slash safety,
 *                           length bounds
 *   isValidSessionId      – happy path, empty, whitespace-only, control chars,
 *                           length limit
 *   isValidString         – defaults, custom min/max, trim behaviour,
 *                           non-string rejection
 */

import {
  isChatIdScopedToUser,
  isValidSessionId,
  isValidString,
} from "@/lib/validation";

// ─── isChatIdScopedToUser ────────────────────────────────────────────────────

/**
 * Test suite
 */
describe("isChatIdScopedToUser()", () => {
  const uid = "user123";

  it("returns true for a correctly scoped chatId", () => {
    expect(isChatIdScopedToUser(`chat_${uid}_abc`, uid)).toBe(true);
  });

  it("returns false when the uid is different", () => {
    expect(isChatIdScopedToUser("chat_user456_abc", uid)).toBe(false);
  });

  it("returns false when chatId contains a forward slash", () => {
    // Slashes would allow path traversal in Firestore document IDs
    expect(isChatIdScopedToUser(`chat_${uid}_a/b`, uid)).toBe(false);
  });

  it("returns false for a chatId that is too short (< 8 chars)", () => {
    expect(isChatIdScopedToUser("chat_u", uid)).toBe(false);
  });

  it("returns false for a chatId that exceeds 200 characters", () => {
    const long = `chat_${uid}_${"x".repeat(200)}`;
    expect(isChatIdScopedToUser(long, uid)).toBe(false);
  });

  it("returns false for a non-string chatId", () => {
    expect(isChatIdScopedToUser(null, uid)).toBe(false);
    expect(isChatIdScopedToUser(undefined, uid)).toBe(false);
    expect(isChatIdScopedToUser(42, uid)).toBe(false);
  });

  it("returns false when chatId does not start with the expected prefix", () => {
    expect(isChatIdScopedToUser(`session_${uid}_abc`, uid)).toBe(false);
  });
});

// ─── isValidSessionId ────────────────────────────────────────────────────────

/**
 * Test suite
 */
describe("isValidSessionId()", () => {
  it("returns true for a typical session ID", () => {
    expect(isValidSessionId("sess_abc-123_XYZ")).toBe(true);
  });

  it("returns false for an empty string", () => {
    expect(isValidSessionId("")).toBe(false);
  });

  it("returns false for a whitespace-only string", () => {
    expect(isValidSessionId("   ")).toBe(false);
  });

  it("returns false for a string containing a newline", () => {
    expect(isValidSessionId("abc\ndef")).toBe(false);
  });

  it("returns false for a string containing a carriage return", () => {
    expect(isValidSessionId("abc\rdef")).toBe(false);
  });

  it("returns false for a string containing a null byte", () => {
    expect(isValidSessionId("abc\x00def")).toBe(false);
  });

  it("returns false for a string exceeding 256 characters", () => {
    expect(isValidSessionId("a".repeat(257))).toBe(false);
  });

  it("returns true for a string of exactly 256 characters", () => {
    expect(isValidSessionId("a".repeat(256))).toBe(true);
  });

  it("returns false for non-string values", () => {
    expect(isValidSessionId(null)).toBe(false);
    expect(isValidSessionId(undefined)).toBe(false);
    expect(isValidSessionId(123)).toBe(false);
  });
});

// ─── isValidString ───────────────────────────────────────────────────────────

/**
 * Test suite
 */
describe("isValidString()", () => {
  it("returns true for a normal non-empty string with default options", () => {
    expect(isValidString("hello")).toBe(true);
  });

  it("returns false for an empty string (default min=1)", () => {
    expect(isValidString("")).toBe(false);
  });

  it("trims whitespace before checking length by default", () => {
    // "   " trims to "" which has length 0, below min=1
    expect(isValidString("   ")).toBe(false);
  });

  it("respects trim:false option", () => {
    // With trim:false, "   " has length 3 which satisfies min=1
    expect(isValidString("   ", { trim: false })).toBe(true);
  });

  it("returns false when string is shorter than custom min", () => {
    expect(isValidString("ab", { min: 5 })).toBe(false);
  });

  it("returns false when string is longer than custom max", () => {
    expect(isValidString("hello world", { max: 5 })).toBe(false);
  });

  it("returns true when string length equals the min boundary", () => {
    expect(isValidString("hi", { min: 2, max: 10 })).toBe(true);
  });

  it("returns true when string length equals the max boundary", () => {
    expect(isValidString("hello", { min: 1, max: 5 })).toBe(true);
  });

  it("returns false for non-string values", () => {
    expect(isValidString(null)).toBe(false);
    expect(isValidString(42)).toBe(false);
    expect(isValidString({})).toBe(false);
    expect(isValidString([])).toBe(false);
  });
});
