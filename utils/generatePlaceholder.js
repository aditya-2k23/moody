import { generator } from "@/firebase";

export const generateCreativePlaceholder = async () => {
  const prompt = `You are an AI assistant for a journaling app. Generate a single, creative, engaging, and emotionally intelligent placeholder text for a daily journal entry textarea. The placeholder should inspire the user to reflect on their day, feelings, or experiences. Make it friendly, varied, and never generic. Do NOT include quotes or quotation marks. Only return the placeholder string, nothing else. It should be a maximum of 12 words. Also add an emoji at the end to make it more engaging.`;
  try {
    const result = await generator.generateContent(prompt);
    let text = await result.response.text();
    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```[a-zA-Z]*\n/, '').replace(/```$/, '').trim();
    }
    return text;
  } catch (error) {
    console.error("Error generating creative placeholder:", error);
    return "What happened today... 🫶";
  }
};
