'use server';

import { getAdminAuth } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const impersonatorToken = cookieStore.get('impersonatorToken')?.value;

    if (!impersonatorToken) {
      return NextResponse.json({ error: 'No active impersonation session found.' }, { status: 400 });
    }
    
    const response = NextResponse.json({ originalToken: impersonatorToken });

    // Clear the impersonation cookies
    response.cookies.delete('impersonatorUid');
    response.cookies.delete('impersonatorToken');
    
    return response;

  } catch (error: any) {
    console.error('Error stopping impersonation:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
