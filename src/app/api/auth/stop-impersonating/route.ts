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
    
    // Clear the impersonation cookies
    cookieStore.delete('impersonatorUid');
    cookieStore.delete('impersonatorToken');
    
    // The client will need to re-authenticate with the original user's ID token.
    // For simplicity, we can return the original token to the client.
    return NextResponse.json({ originalToken: impersonatorToken });

  } catch (error: any) {
    console.error('Error stopping impersonation:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
