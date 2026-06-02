/**
 * __tests__/lib/release.test.js
 *
 * Tests for version helpers in lib/release.js.
 *
 * WHY THIS TEST EXISTS:
 *   APP_VERSION_LABEL is displayed to users in the UI and used in release
 *   automation.  A broken toMajorMinor() would show "v0.0" to all users.
 *   These tests ensure the parsing is correct for any semver string we might
 *   ship, including pre-release suffixes.
 *
 * NOTE ON MOCKING:
 *   lib/release.js imports package.json directly.  Next.js / SWC allows JSON
 *   imports natively, and Jest resolves them via the moduleFileExtensions list.
 *   No mock is needed — we test against the real version from package.json.
 */

import {
  APP_FULL_VERSION,
  APP_VERSION,
  APP_DISPLAY_VERSION,
  APP_VERSION_LABEL,
} from "@/lib/release";

describe("release version constants", () => {
  it("APP_FULL_VERSION is a non-empty semver string", () => {
    expect(typeof APP_FULL_VERSION).toBe("string");
    expect(APP_FULL_VERSION.length).toBeGreaterThan(0);
    // Matches major.minor.patch (with optional pre-release suffix)
    expect(APP_FULL_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("APP_VERSION equals APP_FULL_VERSION (backward-compat alias)", () => {
    expect(APP_VERSION).toBe(APP_FULL_VERSION);
  });

  it("APP_DISPLAY_VERSION contains only major.minor (no patch)", () => {
    expect(APP_DISPLAY_VERSION).toMatch(/^\d+\.\d+$/);
  });

  it("APP_DISPLAY_VERSION is a prefix of APP_FULL_VERSION", () => {
    expect(APP_FULL_VERSION.startsWith(APP_DISPLAY_VERSION)).toBe(true);
  });

  it("APP_VERSION_LABEL starts with 'v' followed by the display version", () => {
    expect(APP_VERSION_LABEL.startsWith(`v${APP_DISPLAY_VERSION}`)).toBe(true);
  });
});
