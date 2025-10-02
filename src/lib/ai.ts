// Do NOT import this file from "use client" modules.
if (typeof window !== 'undefined') {
  throw new Error('src/lib/ai.ts can only be imported on the server');
}
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY =
  process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!API_KEY) throw new Error('Missing GOOGLE_API_KEY (Gemini)');

export const MODEL = 'gemini-1.5-flash-latest';

const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateText(prompt: string) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const res = await model.generateContent(prompt);
  return res.response.text();
}
