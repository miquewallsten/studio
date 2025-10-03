
export function assertSingleInstance() {
  const byFile = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const byB64  = !!process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  const byTrip = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
  const sources = [byFile, byB64, byTrip].filter(Boolean).length;
  if (sources > 1) throw new Error('Single-instance guard: define exactly ONE Firebase credential source.');
}
