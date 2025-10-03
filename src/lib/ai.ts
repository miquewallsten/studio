// Server-only; do not import in client components.
if (typeof window !== 'undefined') throw new Error('ai.ts is server-only');
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from './config';

// @ts-ignore keep one client across hot reloads
declare global { var __GENAI__: GoogleGenerativeAI | undefined; var __GENAI_MODEL__: string | undefined; }

export const MODEL = 'gemini-1.5-flash-lite';

function getClient() {
  const key = ENV.GOOGLE_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_API_KEY');
  if (!global.__GENAI__) global.__GENAI__ = new GoogleGenerativeAI(key);
  global.__GENAI_MODEL__ = MODEL;
  return global.__GENAI__;
}

export async function generateText(prompt: string) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL });
  const res = await model.generateContent(prompt);
  return res.response.text();
}
