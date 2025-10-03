
// lib/apiSafe.ts (server)
import { NextResponse } from 'next/server';

export async function apiSafe<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const data = await fn();
    // Ensure we always return a JSON response
    return NextResponse.json({ ok: true, ...((data as any) || {}) });
  } catch (e: any) {
    console.error('API Error:', e); // shows stack in server logs
    // Ensure we always return a JSON response, even on error
    return new NextResponse(
      JSON.stringify({
        ok: false,
        error: String(e?.message || e),
        code: e?.code,
        stack: process.env.NODE_ENV !== 'production' ? e?.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
