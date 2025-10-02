import 'server-only';
import { NextResponse } from 'next/server';
import { ai, MODEL } from '@/lib/ai';
export const runtime = 'nodejs';
export async function GET() {
  try {
    const out = await ai.generate({ prompt: 'ping' });
    return NextResponse.json({ ok: true, model: MODEL, text: out.text() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
