// src/lib/env.ts
import 'server-only';
import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env exactly once, before first parse.
let loaded = false;
function ensureDotenvLoaded() {
  if (loaded) return;
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  loaded = true;
}

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  AI_ENABLED: z.coerce.boolean().default(false),
  GOOGLE_API_KEY: z.string().min(20, 'GOOGLE_API_KEY is required when AI is on').optional(),
  FIREBASE_SERVICE_ACCOUNT_B64: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  ADMIN_FAKE: z.string().optional(),
  RATE_WINDOW_MS: z.coerce.number().default(60000),
  RATE_MAX: z.coerce.number().default(60),
}).superRefine((data, ctx) => {
  // Exactly ONE firebase credential source (unless faking)
  if (data.ADMIN_FAKE !== '1') {
      const byFile = !!data.GOOGLE_APPLICATION_CREDENTIALS;
      const byB64 = !!data.FIREBASE_SERVICE_ACCOUNT_B64;
      const byTriplet = !!(data.FIREBASE_PROJECT_ID && data.FIREBASE_CLIENT_EMAIL && data.FIREBASE_PRIVATE_KEY);
      const sourceCount = [byFile, byB64, byTriplet].filter(Boolean).length;
      if (sourceCount !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide exactly ONE Firebase credential source: FIREBASE_SERVICE_ACCOUNT_B64 OR GOOGLE_APPLICATION_CREDENTIALS OR FIREBASE_* triplet.' });
      }
  }
  // GOOGLE_API_KEY only required if AI is on
  if (data.AI_ENABLED && (!data.GOOGLE_API_KEY || data.GOOGLE_API_KEY.length < 20)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "GOOGLE_API_KEY is required when AI_ENABLED is '1'." , path: ['GOOGLE_API_KEY']});
  }
});

let cachedEnv: z.infer<typeof EnvSchema> | null = null;

export function getENV() {
  if (cachedEnv) return cachedEnv;
  ensureDotenvLoaded();
  try {
    cachedEnv = EnvSchema.parse(process.env);
    return cachedEnv;
  } catch (e: any) {
    console.error("CRITICAL: Failed to parse environment variables.", e.issues);
    throw new Error(`Failed to parse environment variables: ${e.message}`);
  }
}
