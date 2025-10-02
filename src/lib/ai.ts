// This guard prevents the module from ever being imported on the client.
if (typeof window !== 'undefined') {
  throw new Error('src/lib/ai.ts can only be imported on the server');
}

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_API_KEY');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Define a single, stable model string.
export const MODEL = 'gemini-1.5-flash-latest';

/**
 * A simple, centralized helper function for text generation.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text.
 */
export async function generateText(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: MODEL });
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (e: any) {
    console.error('[AI] Error generating text:', e);
    // Ensure a more descriptive error is thrown to the caller.
    throw new Error(`[GoogleGenerativeAI Error]: ${e.message}`);
  }
}
