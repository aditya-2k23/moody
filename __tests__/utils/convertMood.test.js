/**
 * __tests__/utils/convertMood.test.js
 *
 * Tests for the convertMood() default export from utils/index.js.
 *
 * WHY THIS TEST EXISTS:
 *   convertMood is the core mood-normalisation function.  It translates raw
 *   numeric slider values (1–13) into human-readable mood labels and validates
 *   string mood names.  A regression here would silently corrupt every mood
 *   entry stored in Firestore, so deterministic unit tests provide a critical
 *   safety net with zero external dependencies.
 *
 * COVERAGE:
 *   - Numeric mood values → correct label (boundary + mid-range)
 *   - Out-of-range numbers → clamped gracefully
 *   - Valid string moods → returned as-is
 *   - Unknown string moods → falls back to 'Neutral'
 *   - Non-string / non-number inputs → falls back to 'Neutral'
 */

import convertMood, { moods } from "@/utils/index";

const moodKeys = Object.keys(moods); // ['Awful','Sad','Existing','Good','Elated','Grateful',...]

describe("convertMood()", () => {
  describe("numeric input → mood label", () => {
    it("maps 1 to the first mood (index 0)", () => {
      expect(convertMood(1)).toBe(moodKeys[0]);
    });

    it("maps a mid-range value to the correct label", () => {
      // moodValue 5 → index 4 → moodKeys[4]
      expect(convertMood(5)).toBe(moodKeys[4]);
    });

    it("maps the maximum valid value to the last mood", () => {
      const lastIndex = moodKeys.length - 1;
      expect(convertMood(moodKeys.length)).toBe(moodKeys[lastIndex]);
    });

    it("clamps values below 1 to the first mood", () => {
      expect(convertMood(0)).toBe(moodKeys[0]);
      expect(convertMood(-99)).toBe(moodKeys[0]);
    });

    it("clamps values above max to the last mood", () => {
      const last = moodKeys[moodKeys.length - 1];
      expect(convertMood(999)).toBe(last);
    });
  });

  describe("string input → mood label", () => {
    it("returns a known mood string unchanged", () => {
      expect(convertMood("Grateful")).toBe("Grateful");
      expect(convertMood("Awful")).toBe("Awful");
      expect(convertMood("Elated")).toBe("Elated");
    });

    it("returns 'Neutral' for an unknown mood string", () => {
      expect(convertMood("Confused")).toBe("Neutral");
      expect(convertMood("")).toBe("Neutral");
    });
  });

  describe("invalid input → fallback", () => {
    it("returns 'Neutral' for null", () => {
      expect(convertMood(null)).toBe("Neutral");
    });

    it("returns 'Neutral' for undefined", () => {
      expect(convertMood(undefined)).toBe("Neutral");
    });

    it("returns 'Neutral' for a boolean", () => {
      expect(convertMood(true)).toBe("Neutral");
    });

    it("returns 'Neutral' for an object", () => {
      expect(convertMood({})).toBe("Neutral");
    });
  });
});

describe("moods dictionary", () => {
  it("contains all expected mood keys", () => {
    const expected = [
      "Awful", "Sad", "Existing", "Good", "Elated",
      "Grateful", "Excited", "Neutral", "Anxious",
      "Unsure", "Tired", "Stressed", "Angry",
    ];
    expect(Object.keys(moods)).toEqual(expected);
  });

  it("every mood key maps to an emoji string", () => {
    Object.values(moods).forEach((emoji) => {
      expect(typeof emoji).toBe("string");
      expect(emoji.length).toBeGreaterThan(0);
    });
  });
});
