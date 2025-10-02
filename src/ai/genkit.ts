import 'server-only';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiVersion: 'v1beta', apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY})],
});
