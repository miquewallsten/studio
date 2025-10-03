
import fs from 'node:fs';
import path from 'node:path';

export function assertSingleInstance() {
  const byFile = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const byB64  = !!process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  const byTriplet = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

  const sources = [byFile, byB64, byTriplet].filter(Boolean).length;
  if (sources > 1) throw new Error('Single-instance guard: set exactly ONE Firebase credential source (file OR base64 OR triplet).');

  // If file mode, assert the file exists and we can read project_id
  if (byFile) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS!;
    const abs = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
    if (!fs.existsSync(abs)) throw new Error(`Single-instance guard: credential file missing at ${abs}`);
  }
}
