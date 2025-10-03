import { NextResponse } from 'next/server';
import { generateText, MODEL } from '@/lib/ai';
export const runtime = 'nodejs';
export async function GET() {
  try {
    const text = await generateText('ping');
    return NextResponse.json({ ok: true, model: MODEL, text });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
