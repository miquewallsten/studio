import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  GOOGLE_API_KEY: z.string().min(10),
  ADMIN_FAKE: z.string().optional(), // '1' to enable mock admin
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_B64: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
});

export const ENV = EnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  ADMIN_FAKE: process.env.ADMIN_FAKE,
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  FIREBASE_SERVICE_ACCOUNT_B64: process.env.FIREBASE_SERVICE_ACCOUNT_B64,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
});
