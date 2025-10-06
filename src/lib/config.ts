export const ENV = {
  AI_ENABLED: process.env.AI_ENABLED === 'true' || process.env.AI_ENABLED === '1',
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
  FIREBASE_SERVICE_ACCOUNT_B64: process.env.FIREBASE_SERVICE_ACCOUNT_B64 || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  // normalize \n for private key if someone pasted it on one line
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  NODE_ENV: (process.env.NODE_ENV as 'development'|'production'|'test') || 'development',
};
