import fs from 'fs';

const BAD = [
  "v1beta",
  "-latest",
  "gemini-pro",
  "gemini-1.5-",
  "from 'genkit'",
  "from \"genkit\"",
  "from '@genkit-ai",
];

const files = process.argv.slice(2);
let failed = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const str of BAD) {
    if (content.includes(str)) {
      console.error(`ERROR: Found forbidden string "${str}" in ${file}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error('\nPlease remove forbidden strings from the files listed above.');
  process.exit(1);
}

// Also flag suspicious env patterns appearing together
const ENV_BAD = [
  'GOOGLE_APPLICATION_CREDENTIALS=',
  'FIREBASE_SERVICE_ACCOUNT_B64=',
  'FIREBASE_PROJECT_ID=',
];
const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  const e = fs.readFileSync(envFile,'utf8');
  const has = (s)=>e.includes(s);
  const file = has(ENV_BAD[0]), b64 = has(ENV_BAD[1]), trip = has(ENV_BAD[2]);
  const n = [file,b64,trip].filter(Boolean).length;
  if (n > 1) {
    console.error('Single-instance guard: .env.local appears to define multiple Firebase credential sources. Keep exactly ONE.');
    process.exit(1);
  }
}
