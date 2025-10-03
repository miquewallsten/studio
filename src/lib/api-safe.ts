// lib/apiSafe.ts (server)
import { NextResponse } from 'next/server';

export async function apiSafe<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const data = await fn();
    return NextResponse.json({ ok: true, ...((data as any) || {}) });
  } catch (e: any) {
    console.error('API Error:', e); // shows stack in server logs
    return NextResponse.json(
      { ok: false, error: String(e?.message || e), code: e?.code, stack: process.env.NODE_ENV !== 'production' ? e?.stack : undefined },
      { status: 500 }
    );
  }
}
