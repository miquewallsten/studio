import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

function normalizePem(pkRaw: string) {
  let pk = pkRaw.replace(/\\n/g,'\\n').replace(/\\r/g,'').trim();
  return pk;
}

export const runtime = 'nodejs';
export async function GET() {
  try {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    return NextResponse.json({
      hasFile: !!credPath,
      hasB64: !!b64,
      filePath: credPath || null,
      b64Len: b64 ? b64.length : 0
    });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 });
  }
}
