
import 'server-only';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const MODEL = 'gemini-2.5-flash-lite' as const;

export function getAiClient() {
  const AI_ENABLED = process.env.AI_ENABLED === '1';
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  if (!AI_ENABLED || !GOOGLE_API_KEY) return null;
  
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  return genAI.getGenerativeModel({ model: MODEL });
}
