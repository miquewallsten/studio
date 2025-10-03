
import { execSync } from 'node:child_process';

const out = execSync(`grep -RIn "gemini-" src | grep -v "src/lib/ai.ts" | grep -v "src/lib/config.ts" || true`).toString().trim();

if (out) {
  console.error("LLM string drift detected outside allowed files:\n"+out);
  process.exit(1);
}

const genkitOut = execSync(`grep -RIn "from 'genkit'\\|from \\"genkit\\"\\|from '@genkit-ai'" src || true`).toString().trim();
if (genkitOut) {
    console.error("Disallowed genkit import found:\n" + genkitOut);
    process.exit(1);
}


console.log("LLM strings OK");
