// Server-only; do not import in client components.
if (typeof window !== 'undefined') throw new Error('ai.ts is server-only');
import { GoogleGenerativeAI } from '@google/generative-ai';

const key = process.env.GOOGLE_API_KEY;
if (!key) throw new Error('Missing GOOGLE_API_KEY');

const genAI = new GoogleGenerativeAI(key);
export const MODEL = 'gemini-1.5-flash-latest';

export async function generateText(prompt: string) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const res = await model.generateContent(prompt);
  return res.response.text();
}
