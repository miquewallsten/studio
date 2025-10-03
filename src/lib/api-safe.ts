
import { NextResponse } from 'next/server';
import { logger } from './logger';

export async function apiSafe<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const data = await fn();
    // Ensure we always return a JSON response, even if data is null/undefined
    return NextResponse.json({ ok: true, ...(data as object || {}) });
  } catch (e: any) {
    logger.error('API Error in apiSafe', {
        message: e.message,
        code: e.code,
        stack: process.env.NODE_ENV !== 'production' ? e.stack : undefined,
    });
    
    // Determine status code from error if possible, otherwise default to 500
    const status = typeof e.status === 'number' ? e.status : 500;

    return new NextResponse(
      JSON.stringify({
        ok: false,
        error: e.message || 'An internal server error occurred.',
        code: e.code,
      }),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
