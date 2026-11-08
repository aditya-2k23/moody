/**
 * __tests__/lib/genai.test.js
 *
 * WHY THIS TEST EXISTS:
 *   @google/genai v3 defaults to the v1 API. Insights (responseSchema), chat and
 *   embeddings (gemini-embedding-2-preview) were built against v1beta, so every
 *   Gemini client must keep apiVersion "v1beta". A missing key must fail loudly.
 */
jest.mock("@google/genai", () => ({ GoogleGenAI: jest.fn() }));

import { GoogleGenAI } from "@google/genai";
import { getGenAIClient } from "@/lib/genai";

describe("getGenAIClient", () => {
  const original = process.env.GEMINI_API_KEY;
  afterEach(() => {
    process.env.GEMINI_API_KEY = original;
    GoogleGenAI.mockClear();
  });

  it("creates a v1beta client with the configured key", () => {
    process.env.GEMINI_API_KEY = "test-key";
    getGenAIClient();
    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "test-key", apiVersion: "v1beta" });
  });

  it("throws when the key is missing or blank", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    process.env.GEMINI_API_KEY = "  ";
    expect(() => getGenAIClient()).toThrow("AI service is not configured");
    expect(GoogleGenAI).not.toHaveBeenCalled();
    console.error.mockRestore();
  });
});
