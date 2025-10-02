import 'server-only';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const DEFAULT_MODEL = 'googleai/gemini-1.5-flash-latest';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1',
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }),
  ],
});

export async function generateText(prompt: string) {
    const llmResponse = await ai.generate({
        model: DEFAULT_MODEL,
        prompt: prompt,
    });
    return llmResponse.text;
}
