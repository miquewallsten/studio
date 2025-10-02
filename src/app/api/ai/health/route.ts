import 'server-only';
import { NextResponse } from 'next/server';
import { ai, DEFAULT_MODEL, generateText } from '@/ai/genkit';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const text = await generateText('ping');
    return NextResponse.json({ ok: true, model: DEFAULT_MODEL, text });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
