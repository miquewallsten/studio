
import { NextResponse } from "next/server";
import { MODEL, getAiClient } from "@/lib/ai";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getApps } from "firebase-admin/app";
import { config } from "@/lib/config";

export const runtime = 'nodejs';

export async function GET() {
  let adminApps = 0;
  try { getAdminAuth(); adminApps = getApps().length; } catch { adminApps = 0; }
  
  const aiClient = getAiClient();
  const aiModel = aiClient ? MODEL : 'disabled';

  return NextResponse.json({ 
      ok: true, 
      adminApps, 
      credentialSource: config.credentialSource, 
      aiModel 
  });
}
