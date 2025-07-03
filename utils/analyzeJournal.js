import { generator } from "@/firebase";

export const analyzeEntry = async (journal_entry) => {
  try {
    const prompt = `You are an AI journal assistant that helps users reflect on their mental well-being. A user has written a journal entry. Your task is to analyze the entry and provide the following:

    1. **Mood**: Categorize the emotional tone as one of [Happy, Sad, Angry, Anxious, Excited, Grateful, Tired, Stressed, Neutral].
    2. **Summary**: Write a one-line summary of the journal entry.
    3. **Insight or Tip**: Give a kind, encouraging suggestion based on their emotional tone and content.

    Here is the user's journal entry:
    ---
      "${journal_entry}"
    ---

    Respond in this JSON format:
    {
      "mood": "...",
      "summary": "...",
      "insight": "..."
    }
    `;

    const result = await generator.generateContent(prompt);
    let text = await result.response.text();

    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```[a-zA-Z]*\n/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing journal entry:", error);
    throw new Error("Failed to generate insights. Please try again.");
  }
};
