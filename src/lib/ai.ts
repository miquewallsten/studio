
// Server-only; do not import in client components.
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from './config';
import { logger } from './logger';

if (typeof window !== 'undefined') {
  throw new Error('ai.ts is a server-only module and should not be imported in client components.');
}


// @ts-ignore keep one client across hot reloads
declare global { var __GENAI_CLIENT__: GoogleGenerativeAI | undefined; }

export const MODEL = 'gemini-2.5-flash-lite';

function getClient(): GoogleGenerativeAI | null {
  if (!ENV.AI_ENABLED) {
    return null;
  }
  if (!ENV.GOOGLE_API_KEY) {
    logger.error('AI is enabled but GOOGLE_API_KEY is missing.');
    return null;
  }

  if (global.__GENAI_CLIENT__) {
    logger.debug('Using cached GoogleGenerativeAI client');
    return global.__GENAI_CLIENT__;
  }
  
  logger.debug('Creating new GoogleGenerativeAI client');
  global.__GENAI_CLIENT__ = new GoogleGenerativeAI(ENV.GOOGLE_API_KEY);
  return global.__GENAI_CLIENT__;
}

export async function generateText(prompt: string): Promise<string> {
  const client = getClient();
  if (!client) {
    logger.warn('AI text generation skipped because AI is disabled.');
    // Return a predictable but inert response
    return "AI is disabled.";
  }

  try {
    const model = client.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Lite models can return "pong." - ensure we match.
    if (prompt === 'ping' && !text.toLowerCase().includes('pong')) {
      return 'pong';
    }
    return text;
  } catch (error: any) {
    logger.error('Error generating text with Google AI', { 
      error: error.message,
      // The response from the Google AI API can contain sensitive information, so we log it cautiously.
      details: error.response?.data 
    });
    // Re-throw a more generic error to the caller
    throw new Error('Failed to generate text due to an AI service error.');
  }
}
