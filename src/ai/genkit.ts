'use server';

import {genkit, type Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const plugins: Plugin<any>[] = [];

if (process.env.GOOGLE_API_KEY) {
  plugins.push(googleAI());
}

genkit({
  plugins,
  enableTracingAndMetrics: true,
});

export {ai} from 'genkit/ai';
