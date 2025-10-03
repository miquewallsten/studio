import { NextResponse } from 'next/server';
import { MODEL } from '@/lib/ai';

export const runtime = 'nodejs';

export async function GET() {
  const source =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'file' :
    process.env.FIREBASE_SERVICE_ACCOUNT_B64 ? 'b64' :
    (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ? 'triplet' :
    'adc_or_missing';

  return NextResponse.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV,
    adminFake: process.env.ADMIN_FAKE === '1',
    credentialSource: source,
    aiModel: MODEL,
  });
}
