
import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const MODEL = "gemini-2.5-flash-lite";

export function getAiClient() {
  if (process.env.AI_ENABLED !== "1") return null;
  const key = process.env.GOOGLE_API_KEY;
  if (!key || key.length < 10) return null;
  return new GoogleGenerativeAI({ apiKey: key });
}
