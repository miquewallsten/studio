
import { NextResponse } from "next/server";
import { MODEL, getAiClient } from "@/lib/ai";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

export const runtime = 'nodejs';

function getCredentialSource() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) return 'b64';
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return 'file';
    return 'adc_or_missing';
}


export async function GET() {
  let adminApps = 0;
  try { getAdminAuth(); adminApps = admin.apps.length; } catch { adminApps = 0; }
  
  const aiClient = getAiClient();
  const aiModel = aiClient ? MODEL : 'disabled';

  return NextResponse.json({ 
      ok: true, 
      adminApps, 
      credentialSource: getCredentialSource(), 
      aiModel 
  });
}
