import { NextResponse } from 'next/server';
import { generateText, MODEL } from '@/lib/ai';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const text = await generateText(prompt ?? 'ping');
  return NextResponse.json({ ok: true, model: MODEL, text });
}
