#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const forbidden = [
  'v1beta',
  '-latest',
  'gemini-pro',
  'gemini-1.5-',
  "from 'genkit'",
  'from "genkit"',
  "from '@genkit-ai",
];

const projectRoot = path.resolve(process.cwd());
const srcDir = path.join(projectRoot, 'src');

let violations = [];

function checkFile(filePath) {
  if (filePath.includes('node_modules') || filePath.endsWith('check-llm-strings.mjs')) {
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // Stricter rule for "gemini-"
  if (content.includes('gemini-') && !filePath.endsWith('src/lib/ai.ts')) {
     const lines = content.split('\n');
     for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('gemini-')) {
            violations.push(`${filePath}:${i+1}: Found hard-coded 'gemini-' string. Please import 'MODEL' from '@/lib/ai' instead.`);
        }
     }
  }


  for (const f of forbidden) {
    if (content.includes(f)) {
       const lines = content.split('\n');
       for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(f)) {
            violations.push(`${filePath}:${i+1}: Found forbidden string "${f}"`);
        }
       }
    }
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseDir(fullPath);
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(fullPath)) {
      checkFile(fullPath);
    }
  }
}

console.log('Running LLM/GenAI string check...');
traverseDir(srcDir);


// Also flag suspicious env patterns appearing together
const ENV_BAD = [
  'GOOGLE_APPLICATION_CREDENTIALS=',
  'FIREBASE_SERVICE_ACCOUNT_B64=',
  'FIREBASE_PROJECT_ID=',
];
const envFile = '.env';
if (fs.existsSync(envFile)) {
  const e = fs.readFileSync(envFile,'utf8');
  const has = (s)=>e.includes(s) && !e.match(new RegExp(`^\\s*#\\s*${s}`));
  const file = has(ENV_BAD[0]), b64 = has(ENV_BAD[1]), trip = has(ENV_BAD[2]);
  const n = [file,b64,trip].filter(Boolean).length;
  if (n > 1) {
    violations.push(`${envFile}: Single-instance guard: .env appears to define multiple Firebase credential sources. Keep exactly ONE.`);
  }
}


if (violations.length > 0) {
  console.error('❌ FAILED: Found forbidden strings in the codebase:');
  violations.forEach(v => console.error(`   - ${v}`));
  process.exit(1);
}

console.log('✅ PASSED: No forbidden LLM/GenAI strings found.');
