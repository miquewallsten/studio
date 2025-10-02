
'use server';
/**
 * @fileOverview A conversational AI agent for tenant support.
 *
 * - supportConversation - A function that handles a support conversation.
 */

import { generateText } from '@/ai/genkit';
import { sendEmail } from './send-email-flow';
import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export type Message = {
  role: 'user' | 'model';
  content: Array<{ text: string }>;
};

export type SupportConversationInput = {
  history: Message[];
  userName: string;
  userEmail: string;
};


export async function supportConversation(input: SupportConversationInput): Promise<string> {
    const { history, userName, userEmail } = input;

    const systemPrompt = `You are a friendly and empathetic support agent for TenantCheck. Your goal is to talk to a user named ${userName} to understand their complaint or suggestion.

    Rules:
    1.  Start by asking clarifying questions to understand the issue fully.
    2.  If it's a complaint, ask about the specific problem, when it occurred, and what the user would like to see as a resolution.
    3.  If it's a suggestion, ask about the idea and how it would improve their experience.
    4.  Maintain a polite and professional tone at all times.
    5.  Once you are confident you have all the necessary details, respond with the special string "SAVE_AND_CLOSE" and NOTHING ELSE. This will trigger the system to save your summary. Do not ask for permission; just use the special string.
    `;
    
    const fullPrompt = `${systemPrompt}\n\nConversation History:\n${history.map(h => `${h.role}: ${h.content[0].text}`).join('\n')}\nmodel:`;
    
    let response = await generateText(fullPrompt);

    if (response.includes("SAVE_AND_CLOSE")) {
         // Now, create a summary of the conversation to save.
         const summarizationPrompt = `Based on the following conversation, create a concise, one-paragraph summary of the user's issue.
         Conversation:
         ${history.map(h => `${h.role}: ${h.content[0].text}`).join('\n')}
         
         Summary:`;

         const summary = await generateText(summarizationPrompt);
         const category = summary.toLowerCase().includes('complaint') ? 'Complaint' : 'Suggestion';

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

        // 2. Save feedback to Firestore
        const db = getAdminDb();
        await db.collection('feedback').add({
            userName,
            userEmail,
            summary,
            category,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'SupportChatbot'
        });
        
        // This is the special string the UI will look for to close the chat.
        return 'SUPPORT_TICKET_CREATED';
    }


    return response;
}
