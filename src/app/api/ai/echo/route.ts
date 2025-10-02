import 'server-only';
import { NextResponse } from 'next/server';
import { generateText, MODEL } from '@/lib/ai';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  const { prompt } = await req.json();
  const text = await generateText(prompt ?? 'hello');
  return NextResponse.json({ model: MODEL, text });
}
