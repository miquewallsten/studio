
import { NextResponse } from 'next/server';
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
    nodeEnv: ENV.NODE_ENV,
    adminFake: ENV.ADMIN_FAKE === '1',
    credentialSource: source,
    aiModel: MODEL,
  });
}
