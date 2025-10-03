
import 'server-only';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getENV } from './config';

export const MODEL = 'gemini-2.5-flash-lite' as const;

export function getAiClient() {
  const ENV = getENV();
  if (!ENV.AI_ENABLED || !ENV.GOOGLE_API_KEY) return null;
  
  const genAI = new GoogleGenerativeAI(ENV.GOOGLE_API_KEY);
  return genAI.getGenerativeModel({ model: MODEL });
}
