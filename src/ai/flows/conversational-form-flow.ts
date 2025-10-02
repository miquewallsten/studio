
'use server';
/**
 * @fileOverview A conversational AI agent for filling out forms.
 *
 * - conversationalFormFlow - A function that handles the conversational chat for form filling.
 * - ConversationalFormInput - The input type for the flow.
 * - ConversationalFormOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

export const ConversationalFormInputSchema = z.object({
  history: z.array(MessageSchema),
  questions: z.array(z.string()),
  userName: z.string(),
});
export type ConversationalFormInput = z.infer<typeof ConversationalFormInputSchema>;

export const ConversationalFormOutputSchema = z.string();
export type ConversationalFormOutput = z.infer<typeof ConversationalFormOutputSchema>;

export async function conversationalForm(input: ConversationalFormInput): Promise<ConversationalFormOutput> {
  return conversationalFormFlow(input);
}

const systemPrompt = `You are a friendly and professional AI assistant. Your goal is to guide a user named {{userName}} through a series of questions to fill out a form.

Here are the questions you need to ask:
{{#each questions}}
- {{{this}}}
{{/each}}

Rules:
1.  Ask only ONE question at a time.
2.  Start by greeting the user by their name and asking the first question.
3.  Wait for the user's response before moving to the next question.
4.  If a user's answer is very short or unclear, you can ask a polite follow-up question like "Could you please provide a bit more detail?".
5.  Once you have asked all the questions and received answers for them, respond with ONLY the following message, exactly as written: "FORM_COMPLETE". Do not add any other text or explanation before or after this message.
`;

const conversationalFormFlow = ai.defineFlow(
  {
    name: 'conversationalFormFlow',
    inputSchema: ConversationalFormInputSchema,
    outputSchema: ConversationalFormOutputSchema,
  },
  async ({ history, questions, userName }) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: {
        text: history.length > 0 ? history[history.length -1].content[0].text : "Let's begin.",
        context: {
          questions,
          userName,
        }
      },
      history: history.slice(0, -1), // Pass all but the last message as history
      system: systemPrompt,
    });

    return llmResponse.text;
  }
);

    