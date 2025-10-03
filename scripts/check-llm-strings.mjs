
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const BAD = ['v1beta','-latest','gemini-pro','gemini-1.5-','@genkit-ai','from \\'genkit\\''];
const files = execSync("git ls-files '*.ts' '*.tsx' '*.js' '*.jsx'").toString().trim().split('\n');
let badHits = [];
for (const f of files) {
  const s = fs.readFileSync(f,'utf8');
  for (const b of BAD) if (s.includes(b)) badHits.push({file:f, b});
}
if (badHits.length) {
  console.error('Forbidden strings found:');
  for (const h of badHits) console.error(` - ${h.b} in ${h.file}`);
  process.exit(1);
}
console.log('OK: no forbidden strings');
