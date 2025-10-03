
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
  if (data.ADMIN_FAKE === '1') return;

  const byFile = !!data.GOOGLE_APPLICATION_CREDENTIALS;
  // Ensure B64 is not just present, but a meaningful string.
  const byB64 = data.FIREBASE_SERVICE_ACCOUNT_B64 && data.FIREBASE_SERVICE_ACCOUNT_B64.length > 64;
  const byTriplet = !!(data.FIREBASE_PROJECT_ID && data.FIREBASE_CLIENT_EMAIL && data.FIREBASE_PRIVATE_KEY);
  
  const sourceCount = [byFile, byB64, byTriplet].filter(Boolean).length;

  // This is the key change: Only error if there's a conflict (more than one source).
  // If zero sources are provided, we assume Application Default Credentials (ADC) will be used.
  if (sourceCount > 1) {
    ctx.addIssue({ 
      code: z.ZodIssueCode.custom, 
      message: 'Provide exactly ONE valid Firebase credential source: a non-empty FIREBASE_SERVICE_ACCOUNT_B64, a path in GOOGLE_APPLICATION_CREDENTIALS, or the FIREBASE_* triplet.' 
    });
  }
  
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
    // Re-throw with a more user-friendly message that includes the Zod details.
    throw new Error(`Failed to parse environment variables: ${e.message}`);
  }
}
