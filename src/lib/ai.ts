
import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const MODEL = "gemini-2.5-flash-lite";

export function getAiClient() {
  if (process.env.AI_ENABLED !== "1") return null;
  const key = process.env.GOOGLE_API_KEY;
  if (!key || key.length < 10) return null;
  return new GoogleGenerativeAI(key);
}

export async function generateText(prompt: string): Promise<string> {
  const client = getAiClient();
  if (!client) {
    return "AI is disabled.";
  }

  try {
    const model = client.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text;
  } catch (error: any) {
    console.error('Error generating text with Google AI', { 
      error: error.message,
    });
    throw new Error('Failed to generate text due to an AI service error.');
  }
}
