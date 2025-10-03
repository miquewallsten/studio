
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = 'src';
const CANON = 'src/lib/ai.ts';
const RE = /\bgemini-[\w\.\-]+/i;
let found = 0;

function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) {
      // Exclude node_modules from the search
      if (f === 'node_modules') continue;
      walk(p);
    } else if (st.isFile() && (p.endsWith('.ts') || p.endsWith('.tsx'))) {
      if (p.replace(/\\/g, '/') === CANON) continue;
      const text = readFileSync(p, 'utf8');
      const match = text.match(RE);
      if (match) {
        console.error(`❌ Hard-coded Gemini model string "${match[0]}" found in ${p}`);
        found++;
      }
    }
  }
}

try {
    walk(ROOT);
    if (found > 0) {
        console.error(`\nFound ${found} hard-coded model string(s). Please import the 'MODEL' constant from '${CANON}' instead.`);
        process.exit(1);
    } else {
        console.log('✅ No hard-coded Gemini model strings found.');
    }
} catch(e) {
    console.error("Error during script execution:", e);
    process.exit(1);
}
