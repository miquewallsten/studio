'use server';
/**
 * @fileOverview A conversational AI assistant for Super Admins.
 *
 * - chat - A function that handles the conversational chat with the assistant.
 */

import { generateText } from '@/lib/ai';

const systemPrompt = `You are a helpful AI assistant for a Super Admin of the TenantCheck platform.
Your purpose is to assist the admin with managing the application by answering questions about metrics and performing actions on their behalf.
If the user asks to seed the database, you cannot do that.
Be conversational and confirm when you have completed an action.
If you are asked to do something you don't have a tool for, clearly state that you do not have that capability.
You MUST respond in the user's language. The user's current language is: {{locale}}.
`;

// This is a simplified version. The tools logic would need to be re-implemented
// using a different pattern if required, likely by parsing user intent and calling
// server actions directly. For now, we are simplifying to a text-only assistant.

export async function chat(input: { history?: any[], prompt: string, locale?: string }): Promise<string> {
    const { prompt, locale = 'en' } = input;
    
    // A simple way to build a history string for the prompt
    const historyText = input.history?.map(h => `${h.role}: ${h.content?.[0]?.text || ''}`).join('\n');

    const fullPrompt = `
${systemPrompt.replace('{{locale}}', locale)}

${historyText}

user: ${prompt}
model:
`;
    
  return generateText(fullPrompt);
}
