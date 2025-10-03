
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
