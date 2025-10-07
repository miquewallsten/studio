'use server';

import {ai} from '@/ai/genkit';
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {Message} from 'ai';

const model = 'google/gemini-1.5-flash-preview';

const systemPrompt = `You are a helpful AI assistant for a Super Admin of an application called TenantCheck. Your purpose is to assist the admin by performing actions on their behalf. You MUST respond in the user's language. Be concise and helpful.`;

export async function POST(req: NextRequest) {
  try {
    const {messages} = await req.json();

    const history: Message[] = messages.map((m: any) => ({
      role: m.role,
      content: [{text: m.content}],
    }));

    const response = await ai.generate({
      model: model,
      prompt: {
        text: systemPrompt,
      },
      history,
    });

    const text = response.text;

    return NextResponse.json({
      text,
    });
  } catch (e: any) {
    console.error('AI Chat Error:', e);
    return NextResponse.json({error: e.message || 'An error occurred.'}, {status: 500});
  }
}
