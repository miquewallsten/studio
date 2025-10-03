
import { NextResponse } from 'next/server';
import { generateText, MODEL } from '@/lib/ai';
import { logger } from '@/lib/logger';
import { ENV } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET() {
  if (!ENV.AI_ENABLED) {
    return NextResponse.json({ ok: true, model: 'disabled', text: 'pong' });
  }

  try {
    const text = await generateText('ping');
    if (!text.toLowerCase().includes('pong')) {
        throw new Error('AI health check failed: "pong" not found in response.');
    }
    logger.info('AI health check successful');
    return NextResponse.json({ ok: true, model: MODEL, text: 'pong' });
  } catch (e:any) {
    logger.error('AI health check failed', { error: e.message });
    return NextResponse.json({ ok:false, error:String(e?.message||e), model: MODEL }, { status:500 });
  }
}
