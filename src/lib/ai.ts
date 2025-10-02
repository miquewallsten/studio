import 'server-only';
import { GoogleGenerativeAI } from '@google/generative-ai';

// IMPORTANT: This is a temporary solution for debugging.
// In a real application, use environment variables.
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const MODEL = 'gemini-1.5-flash-latest';

const model = genAI.getGenerativeModel({ model: MODEL });

/**
 * A simple, centralized helper function for text generation.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text.
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (e: any) {
    console.error('[AI] Error generating text:', e);
    throw new Error(`Error generating text: ${e.message}`);
  }
}
