
import * as fs from 'fs';
import * as path from 'path';

const FORBIDDEN_STRINGS = [
  'v1beta',
  '-latest',
  'gemini-pro',
  'gemini-1.5-',
];

const DIRS_TO_CHECK = ['src', 'app'];
const EXCLUDED_FILES = ['check-llm-strings.mjs'];

let errorFound = false;

function checkFile(filePath) {
  if (EXCLUDED_FILES.includes(path.basename(filePath))) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  FORBIDDEN_STRINGS.forEach((str) => {
    if (content.includes(str)) {
      console.error(
        `❌ Error: Found forbidden string "${str}" in file: ${filePath}`
      );
      errorFound = true;
    }
  });
}

function traverseDir(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else {
      checkFile(fullPath);
    }
  });
}

console.log('🔍 Checking for forbidden LLM strings...');

DIRS_TO_CHECK.forEach((dir) => {
    if (fs.existsSync(dir)) {
        traverseDir(dir);
    }
});


if (errorFound) {
  console.error('\n🚨 Failing build due to forbidden strings in the codebase.');
  process.exit(1);
} else {
  console.log('✅ All checks passed. No forbidden strings found.');
  process.exit(0);
}
