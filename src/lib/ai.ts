// Server-only; do not import in client components.
if (typeof window !== 'undefined') throw new Error('ai.ts is server-only');
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from './config';

const key = ENV.GOOGLE_API_KEY;
if (!key) throw new Error('Missing GOOGLE_API_KEY');

const genAI = new GoogleGenerativeAI(key);
// Use a concrete, GA v1 model: no "-latest", no "v1beta"
export const MODEL = 'gemini-1.5-flash-lite';

export async function generateText(prompt: string) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const res = await model.generateContent(prompt);
  return res.response.text();
}
