
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    checkRateLimit(request);
    const cookieStore = cookies();
    const impersonatorToken = cookieStore.get('impersonatorToken')?.value;
    const impersonatorUid = cookieStore.get('impersonatorUid')?.value;

    if (!impersonatorToken || !impersonatorUid) {
      return NextResponse.json({ error: 'No active impersonation session found.' }, { status: 400 });
    }
    
    const response = NextResponse.json({ originalToken: impersonatorToken });

    // Clear the impersonation cookies
    response.cookies.delete('impersonatorUid');
    response.cookies.delete('impersonatorToken');
    
    logger.info('Impersonation stopped', { adminUid: impersonatorUid });

    return response;

  } catch (error: any) {
    logger.error('Error stopping impersonation:', { error: error.message });
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
