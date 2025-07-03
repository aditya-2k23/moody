import { generator } from "@/firebase";

export const analyzeEntry = async (journal_entry) => {
  try {
    const prompt = `You are an AI journal assistant that helps users reflect on their mental well-being. A user has written a journal entry. Your task is to analyze the entry and provide the following:

    1. **Mood**: Categorize the emotional tone as one of [Happy, Sad, Angry, Anxious, Excited, Grateful, Tired, Stressed, Neutral].
    2. **Insight or Tip**: Give a kind, encouraging suggestion based on their emotional tone and content.
    3. **Triggers**: List keywords or events that influenced the mood (e.g., productivity, friends, gratitude).
    4. **Pro Tip**: Give a short, actionable tip based on the user's mood and entry.
    5. **Headline**: Write a short, creative, and mood-appropriate headline for the insight card. It should be positive, supportive, and tailored to the user's mood. Do not use generic phrases like 'Keep the Momentum Going'.

    Here is the user's journal entry:
    ---
      "${journal_entry}"
    ---

    Respond with a valid JSON format:
    {
      "mood": "one of Happy, Elated, Good, Existing, Sad, Awful, Angry, Anxious, Unsure, Excited, Grateful, Tired, Stressed, Neutral",
      "triggers": ["list of keywords or events that influenced the mood"],
      "insight": "a kind, helpful reflection or tip based on the entry",
      "pro_tip": "a short, actionable tip based on the user's mood and entry",
      "headline": "a short, creative, mood-appropriate headline for the insight card"
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
