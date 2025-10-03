
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  
  AI_ENABLED: z.string().default("1").transform(val => val === "1"),
  GOOGLE_API_KEY: z.string().optional(),

  // Firebase Admin Credentials (provide one method)
  FIREBASE_SERVICE_ACCOUNT_B64: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  
  // Firebase Admin Credentials (triplet, alternative to the above)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Rate Limiting (optional)
  RATE_WINDOW_MS: z.coerce.number().default(60000),
  RATE_MAX: z.coerce.number().default(60),

  // Flag to use mocked admin instances for UI development without a backend
  ADMIN_FAKE: z.string().optional(),
})
.superRefine((data, ctx) => {
    // If AI is enabled, GOOGLE_API_KEY is required
    if (data.AI_ENABLED && (!data.GOOGLE_API_KEY || data.GOOGLE_API_KEY.length < 20)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "GOOGLE_API_KEY is required when AI_ENABLED is set to '1' and must be at least 20 characters.",
            path: ['GOOGLE_API_KEY'],
        });
    }

    // Enforce single Firebase credential source
    const byFile = !!data.GOOGLE_APPLICATION_CREDENTIALS;
    const byB64 = !!data.FIREBASE_SERVICE_ACCOUNT_B64;
    const byTriplet = !!(data.FIREBASE_PROJECT_ID && data.FIREBASE_CLIENT_EMAIL && data.FIREBASE_PRIVATE_KEY);
    const sourceCount = [byFile, byB64, byTriplet].filter(Boolean).length;
    
    if (sourceCount > 1) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Provide exactly ONE Firebase credential source: FIREBASE_SERVICE_ACCOUNT_B64, GOOGLE_APPLICATION_CREDENTIALS, or the FIREBASE_* triplet.',
        });
    }
});


export const ENV = EnvSchema.parse(process.env);
export const MODEL = 'gemini-2.5-flash-lite' as const;

function getCredentialSource() {
    if (ENV.FIREBASE_SERVICE_ACCOUNT_B64) return 'b64';
    if (ENV.GOOGLE_APPLICATION_CREDENTIALS) return 'file';
    if (ENV.FIREBASE_PROJECT_ID) return 'triplet';
    return 'adc_or_missing';
}

export const config = {
    ...ENV,
    credentialSource: getCredentialSource(),
}
