
'use server';
/**
 * @fileOverview A conversational AI agent for filling out forms.
 *
 * - conversationalForm - A function that handles the conversational chat for form filling.
 */
import { generateText } from '@/ai/genkit';

export type Message = {
  role: 'user' | 'model';
  content: Array<{ text: string }>;
};

export type ConversationalFormInput = {
  history: Message[];
  questions: string[];
  userName: string;
};

export async function conversationalForm(input: ConversationalFormInput): Promise<string> {
    const { history, questions, userName } = input;

    const systemPrompt = `You are a friendly and professional AI assistant. Your goal is to guide a user named ${userName} through a series of questions to fill out a form.

    Here are the questions you need to ask:
    ${questions.map(q => `- ${q}`).join('\n')}

    Rules:
    1.  Ask only ONE question at a time.
    2.  Start by greeting the user by their name and asking the first question.
    3.  Wait for the user's response before moving to the next question.
    4.  If a user's answer is very short or unclear, you can ask a polite follow-up question like "Could you please provide a bit more detail?".
    5.  Once you have asked all the questions and received answers for them, respond with ONLY the following message, exactly as written: "FORM_COMPLETE". Do not add any other text or explanation before or after this message.
    `;

    const fullPrompt = `${systemPrompt}\n\nConversation History:\n${history.map(h => `${h.role}: ${h.content[0].text}`).join('\n')}\nmodel:`;
    
    const response = await generateText(fullPrompt);
    return response;
}
