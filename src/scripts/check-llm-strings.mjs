import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = 'src';
const CANON = 'src/lib/ai.ts';
const RE = /\bgemini-[\w\.\-]+/i;
let foundError = false;

function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (f !== 'node_modules' && f !== '.next') {
        walk(p);
      }
    }
    else if (st.isFile() && (p.endsWith('.ts') || p.endsWith('.tsx'))) {
      if (p.replace(/\\/g, '/') === CANON) continue;
      const text = readFileSync(p, 'utf8');
      if (RE.test(text)) {
        console.error(`Error: Hard-coded Gemini model string found in ${p}`);
        foundError = true;
      }
    }
  }
}
walk(ROOT);

if (foundError) {
    process.exit(1);
} else {
    console.log('✅ No hard-coded Gemini model strings found.');
}
