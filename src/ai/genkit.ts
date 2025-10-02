'use server';
import 'server-only';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// pick the one you had working:
export const DEFAULT_MODEL = 'googleai/gemini-2.5-flash-lite' as const;

export const ai = genkit({
  plugins: [googleAI({ apiVersion: 'v1', apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })],
});

export const generateText = (prompt: string) =>
  ai.generate({ model: DEFAULT_MODEL, prompt });
