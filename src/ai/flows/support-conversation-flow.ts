'use server';
/**
 * @fileOverview A conversational AI agent for tenant support.
 *
 * - supportConversation - A function that handles a support conversation.
 * - SupportConversationInput - The input type for the flow.
 * - SupportConversationOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendEmail } from './send-email-flow';
import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

export const SupportConversationInputSchema = z.object({
  history: z.array(MessageSchema),
  userName: z.string(),
  userEmail: z.string(),
});
export type SupportConversationInput = z.infer<typeof SupportConversationInputSchema>;

export const SupportConversationOutputSchema = z.string();
export type SupportConversationOutput = z.infer<typeof SupportConversationOutputSchema>;

export async function supportConversation(input: SupportConversationInput): Promise<SupportConversationOutput> {
  return supportConversationFlow(input);
}

const extractAndSummarizeTool = ai.defineTool(
    {
      name: 'extractAndSummarizeTool',
      description: 'Use this tool when you have gathered all necessary information about the user\'s complaint or suggestion to summarize the conversation and send it to the executive team.',
      inputSchema: z.object({
        summary: z.string().describe('A concise summary of the user\'s issue, including whether it is a complaint or a suggestion and all relevant details provided.'),
        category: z.enum(['Complaint', 'Suggestion', 'Other']).describe('The category of the user\'s feedback.'),
      }),
      outputSchema: z.string(),
    },
    async ({ summary, category }, flow) => {
        const { userName, userEmail } = flow.input as SupportConversationInput;
        
        // 1. Send email to executives
        await sendEmail({
            to: 'executives@example.com',
            subject: `New Tenant Feedback Received: ${category}`,
            html: `
                <p>A new piece of feedback has been submitted via the tenant support chatbot.</p>
                <hr />
                <p><strong>From:</strong> ${userName} (${userEmail})</p>
                <p><strong>Category:</strong> ${category}</p>
                <p><strong>AI Summary:</strong></p>
                <p>${summary}</p>
            `
        });

        // 2. Save feedback to Firestore for dashboard widget
        const db = getAdminDb();
        await db.collection('feedback').add({
            userName,
            userEmail,
            summary,
            category,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'SupportChatbot'
        });

        // The presence of this specific string signals the UI to close.
        return 'SUPPORT_TICKET_CREATED';
    }
  );


const systemPrompt = `You are a friendly and empathetic support agent for TenantCheck. Your goal is to talk to a user named {{userName}} to understand their complaint or suggestion.

Rules:
1.  Start by asking clarifying questions to understand the issue fully.
2.  If it's a complaint, ask about the specific problem, when it occurred, and what the user would like to see as a resolution.
3.  If it's a suggestion, ask about the idea and how it would improve their experience.
4.  Maintain a polite and professional tone at all times.
5.  Once you are confident you have all the necessary details, you MUST use the \`extractAndSummarizeTool\` to finalize the conversation. Do not ask for permission; just use the tool.
`;

const supportConversationFlow = ai.defineFlow(
  {
    name: 'supportConversationFlow',
    inputSchema: SupportConversationInputSchema,
    outputSchema: SupportConversationOutputSchema,
  },
  async ({ history, userName, userEmail }) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-pro',
      prompt: {
        text: history[history.length -1].content[0].text,
        context: {
          userName,
          userEmail,
        }
      },
      history: history.slice(0, -1),
      system: systemPrompt,
      tools: [extractAndSummarizeTool]
    });

    const toolResponse = llmResponse.toolRequest();
    if(toolResponse) {
        return toolResponse.output as string;
    }

    return llmResponse.text;
  }
);
