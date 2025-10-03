
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export async function GET() {
  try {
    const adminAuth = getAdminAuth();
    await adminAuth.listUsers(1);
    return NextResponse.json({ ok: true, fake: process.env.ADMIN_FAKE === '1' });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 });
  }
}
