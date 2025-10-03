import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
export const runtime = 'nodejs';
export async function GET() {
  try {
    // lightweight call – checks initialization without requiring a user token
    await getAdminAuth().listUsers(1);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
