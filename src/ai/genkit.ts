import 'server-only';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Correctly initialize Genkit with the Google AI plugin, specifying v1.
export const ai = genkit({
  plugins: [googleAI({ apiVersion: 'v1', apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })],
});

// Define a single, stable model string.
export const DEFAULT_MODEL = 'googleai/gemini-1.5-flash-latest' as const;

// A simple, centralized helper function for text generation.
export async function generateText(prompt: string): Promise<string> {
  const llmResponse = await ai.generate({
    model: DEFAULT_MODEL,
    prompt: prompt,
  });

  return llmResponse.text();
}
