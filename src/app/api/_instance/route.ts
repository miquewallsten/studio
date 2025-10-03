
import { NextResponse } from 'next/server';
import { getApps } from 'firebase-admin/app';
import { MODEL } from '@/lib/ai';
import { ENV } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET() {
  const source =
    ENV.FIREBASE_SERVICE_ACCOUNT_B64 ? 'b64' :
    ENV.GOOGLE_APPLICATION_CREDENTIALS ? 'file' :
    (ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) ? 'triplet' :
    'adc_or_missing';

  return NextResponse.json({
    ok: true,
    adminApps: getApps().length,
    credentialSource: source,
    adminFake: ENV.ADMIN_FAKE === '1',
    aiModel: ENV.AI_ENABLED ? MODEL : 'disabled',
  });
}
