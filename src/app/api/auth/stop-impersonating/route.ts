
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { apiSafe } from '@/lib/api-safe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return apiSafe(async () => {
    checkRateLimit(request);
    const cookieStore = cookies();
    const impersonatorToken =  cookieStore.get('impersonatorToken')?.value;
    const impersonatorUid =  cookieStore.get('impersonatorUid')?.value;

    if (!impersonatorToken || !impersonatorUid) {
      throw { status: 400, message: 'No active impersonation session found.' };
    }
    
    const response = NextResponse.json({ originalToken: impersonatorToken });

    response.cookies.delete('impersonatorUid');
    response.cookies.delete('impersonatorToken');
    
    logger.info('Impersonation stopped', { adminUid: impersonatorUid });

    return response;
  });
}
