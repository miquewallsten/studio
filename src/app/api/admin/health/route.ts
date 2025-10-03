
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';
import { ENV } from '@/lib/config';
import { assertSingleInstance } from '@/lib/instanceGuard';
export const runtime = 'nodejs';
export async function GET() {
  try {
    assertSingleInstance();
    const adminAuth = getAdminAuth();
    await adminAuth.listUsers(1);
    return NextResponse.json({ ok: true, fake: ENV.ADMIN_FAKE === '1' });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 });
  }
}
