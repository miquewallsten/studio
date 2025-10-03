
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  
  // Google AI Key
  GOOGLE_API_KEY: z.string().min(10, 'GOOGLE_API_KEY is required for AI features.'),

  // Firebase Admin Credentials (provide one method)
  FIREBASE_SERVICE_ACCOUNT_B64: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  
  // Firebase Admin Credentials (triplet, alternative to the above)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Flag to use mocked admin instances for UI development without a backend
  ADMIN_FAKE: z.string().optional(),
})
.refine(data => {
    const byFile = !!data.GOOGLE_APPLICATION_CREDENTIALS;
    const byB64 = !!data.FIREBASE_SERVICE_ACCOUNT_B64;
    const byTriplet = !!(data.FIREBASE_PROJECT_ID && data.FIREBASE_CLIENT_EMAIL && data.FIREBASE_PRIVATE_KEY);
    const sourceCount = [byFile, byB64, byTriplet].filter(Boolean).length;
    // In a real dev/prod environment, we want exactly one source.
    // For environments like a CI/CD runner that might use ADC, 0 sources is also acceptable.
    return sourceCount <= 1;
}, {
    message: 'Provide exactly ONE Firebase credential source: FIREBASE_SERVICE_ACCOUNT_B64, GOOGLE_APPLICATION_CREDENTIALS, or the FIREBASE_* triplet.',
});


export const ENV = EnvSchema.parse(process.env);
