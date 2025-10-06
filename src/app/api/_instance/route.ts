import { NextResponse } from 'next/server';
import { MODEL } from '@/lib/ai';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ ok: true, env: process.env.NODE_ENV || 'development', model: MODEL });
}
