import { GoogleGenAI } from "@google/genai";

/**
 * Returns an authenticated Gemini client.
 * @returns {GoogleGenAI} The Gemini client.
 * @throws {Error} If GEMINI_API_KEY is missing or empty.
 */
export function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error("[Gemini] GEMINI_API_KEY environment variable is missing.");
    throw new Error("AI service is not configured. Please contact support.");
  }
  // @google/genai v3 defaults to the v1 API; responseSchema and the preview models we use need v1beta.
  return new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
}
