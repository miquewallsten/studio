
import { NextResponse } from 'next/server';
import { getApps } from 'firebase-admin/app';
import { MODEL, getAiClient } from '@/lib/ai';
import { ENV, config } from '@/lib/config';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET() {
    let adminApps = 0;
    try {
        // This will throw if not configured, which is what we want to check
        getAdminAuth(); 
        adminApps = getApps().length;
    } catch (e) {
        adminApps = 0;
    }

    const aiClient = getAiClient();
    const aiModel = aiClient ? MODEL : 'disabled';

    return NextResponse.json({
        ok: true,
        adminApps,
        credentialSource: config.credentialSource,
        aiModel,
    });
}
