
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const HistoryItemSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

const AssistantRequestSchema = z.object({
  history: z.array(HistoryItemSchema),
  prompt: z.string(),
  locale: z.string().optional(),
});

export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantRequestSchema,
    outputSchema: z.string(),
  },
  async ({history, prompt, locale}) => {
    const llm = ai.model('googleai/gemini-2.5-flash-preview');
    const systemPrompt = `You are a helpful AI assistant for a Super Admin of the TenantCheck platform.
Your purpose is to assist the admin with managing the application by answering questions about metrics and performing actions on their behalf.
Be conversational and confirm when you have completed an action.
If you are asked to do something you don't have a tool for, clearly state that you do not have that capability.
You MUST respond in the user's language. The user's current language is: ${
      locale || 'en'
    }.

Do not respond with JSON, only with conversational text.`;

    const response = await ai.generate({
      model: llm,
      prompt: prompt,
      history: [
        {role: 'system', content: [{text: systemPrompt}]},
        ...history.map(h => ({
          role: h.role,
          content: [{text: h.text}],
        })),
      ],
    });

    return response.text;
  }
);

export async function POST(req: Request) {
  const {history, prompt, locale} = await req.json();
  const text = await assistantFlow({history, prompt, locale});
  return new Response(JSON.stringify({text}), {
    headers: {'Content-Type': 'application/json'},
  });
}
