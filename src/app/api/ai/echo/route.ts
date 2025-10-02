
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { genkit, generation, ai } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

export const runtime = 'nodejs';

// Initialize Genkit with the Google AI plugin
genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1', // Force the stable v1 API
    }),
  ],
});

const echoSchema = z.object({
  prompt: z.string(),
});

const echoFlow = ai.defineFlow(
  {
    name: 'echoFlow',
    inputSchema: echoSchema,
    outputSchema: z.string(),
  },
  async ({ prompt }) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: prompt,
      config: {
        temperature: 0.5,
      },
    });

    return llmResponse.text();
  }
);


export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    const output = await echoFlow({ prompt });
    return NextResponse.json({ text: output });
  } catch (e: any) {
    console.error('[AI Echo] Error generating text:', e);
    // Return a more generic error to the client
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}
