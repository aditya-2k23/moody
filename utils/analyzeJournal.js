import { generator } from "@/firebase";

export const analyzeEntry = async (journal_entry) => {
  try {
    const prompt = `
    You are an AI journal assistant designed to help users reflect on their mental and emotional well-being in a calm, supportive way.

    A user has written a personal journal entry. Analyze the text carefully and generate structured insights that feel human, thoughtful, and grounded in what the user actually wrote.

    ### Your tasks:

    1. **Mood**
      - Identify the dominant emotional tone of the entry.
      - Choose **exactly one** mood from the following list:
      [Elated, Good, Existing, Sad, Awful, Angry, Anxious, Unsure, Excited, Grateful, Tired, Stressed, Neutral]

    2. **Triggers**
      - Extract specific words, events, or themes from the entry that influenced the mood.
      - Keep them short, concrete, and directly tied to the text (e.g., deadlines, friends, uncertainty, rest).

    3. **Insight**
      - Write a kind, empathetic reflection that acknowledges the user’s experience.
      - Avoid clichés, therapy-speak, or judgment.
      - The tone should be reassuring, natural, and supportive.

    4. **Pro Tip**
      - Provide one short, actionable, and realistic suggestion tailored to the user’s mood.
      - It should feel achievable today, not overwhelming.

    5. **Headline**
      - Write a short, creative, mood-appropriate headline for an insight card.
      - It should feel personal and encouraging.
      - Avoid generic motivational phrases or platitudes.

    ---

    ### User’s journal entry:
    """
    ${journal_entry}
    """

    ---

    ### Response format (STRICT JSON ONLY — no explanations, no markdown):
    {
      "mood": "one of Elated, Good, Existing, Sad, Awful, Angry, Anxious, Unsure, Excited, Grateful, Tired, Stressed, Neutral",
      "triggers": ["keywords or events influencing the mood"],
      "insight": "empathetic reflection based on the journal entry",
      "pro_tip": "short, actionable suggestion",
      "headline": "short, creative, mood-appropriate headline"
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
