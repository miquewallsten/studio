#!/usr/bin/env node
/**
 * Repo Analyzer — Next.js / Firebase app
 * Scans your repo and writes analysis-report.md with:
 * - Project layout
 * - API routes & their guards (requireAuth/requireRole)
 * - Client components using Firestore runtime
 * - Server code using firebase-admin
 * - Auth usage (cookies, tokens)
 * - ENV/config keys referenced
 * - Tickets / Forms / Fields references
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'analysis-report.md');

const IGNORE_DIRS = new Set([
  'node_modules','.git','.next','.turbo','.vercel','.pnpm-store','dist','build','out'
]);

const CODE_EXT = new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs']);

// --- helpers
function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir, {withFileTypes:true})) {
    if (name.isDirectory()) {
      if (IGNORE_DIRS.has(name.name)) continue;
      out.push(...walk(path.join(dir, name.name)));
    } else {
      const ext = path.extname(name.name);
      if (CODE_EXT.has(ext)) out.push(path.join(dir, name.name));
    }
  }
  return out;
}

function readSafe(f) {
  try { return fs.readFileSync(f,'utf8'); } catch { return ''; }
}

function rel(p){ return path.relative(ROOT, p).replace(/\\/g,'/'); }

// --- scan
const files = walk(ROOT);

const findings = {
  apiRoutes: [],
  pages: [],
  components: [],
  firebaseClient: [],
  firebaseAdmin: [],
  authGuards: [],
  cookiesUsage: [],
  envReferences: new Map(),
  ticketsFormsFields: [],
  problems: [],
};

// simple detectors (regexes kept readable)
const R = {
  nextApi: /\/app\/api\/(.+?)\/route\.(ts|js)x?/,
  pageFile: /\/app\/(.+?)\/page\.(ts|js)x?/,
  componentDir: /\/components\//,
  firebaseClientImport: /from ['"]firebase\/firestore['"]|getFirestore\(|onSnapshot\(|collection\(|query\(|where\(/,
  firebaseAdminImport: /from ['"]firebase-admin['"]|from ['"]firebase-admin\/(firestore|app)['"]|admin\.initializeApp|admin\.firestore/,
  adminDbUsage: /adminDb\.|getFirestore\(\s*initializeAdmin\(\s*\)\s*\)/,
  requireAuth: /requireAuth\s*\(/,
  requireRole: /requireRole\s*\(/,
  nextRequest: /NextRequest/,
  cookies: /cookies\(\)|headers\(\)|request\.headers|cookieStore/,
  env: /process\.env\.([A-Z0-9_]+)/g,
  tickets: /\b(tickets?|Ticket)\b/,
  forms: /\b(forms?|Form)\b/,
  fields: /\b(fields?|Field)\b/,
};

for (const f of files) {
  const relf = rel(f);
  const txt = readSafe(f);

  // routes & pages
  if (R.nextApi.test(relf)) findings.apiRoutes.push(relf);
  if (R.pageFile.test(relf)) findings.pages.push(relf);
  if (R.componentDir.test(relf)) findings.components.push(relf);

  // firebase client / admin usage
  if (R.firebaseClientImport.test(txt)) findings.firebaseClient.push(relf);
  if (R.firebaseAdminImport.test(txt) || R.adminDbUsage.test(txt)) findings.firebaseAdmin.push(relf);

  // auth guards
  const hasAuth = R.requireAuth.test(txt);
  const hasRole = R.requireRole.test(txt);
  if (hasAuth || hasRole) {
    findings.authGuards.push({
      file: relf,
      requireAuth: hasAuth,
      requireRole: hasRole,
      mentionsNextRequest: R.nextRequest.test(txt)
    });
  }

  // cookies/head headers
  if (R.cookies.test(txt)) findings.cookiesUsage.push(relf);

  // env keys
  let m;
  while ((m = R.env.exec(txt)) !== null) {
    const key = m[1];
    findings.envReferences.set(key, (findings.envReferences.get(key)||0)+1);
  }

  // domain concepts
  const dom = [];
  if (R.tickets.test(txt)) dom.push('tickets');
  if (R.forms.test(txt)) dom.push('forms');
  if (R.fields.test(txt)) dom.push('fields');
  if (dom.length) findings.ticketsFormsFields.push({file: relf, mentions: dom});
}

// de-dup, sort
function uniqSorted(arr){ return Array.from(new Set(arr)).sort(); }
findings.apiRoutes = uniqSorted(findings.apiRoutes);
findings.pages = uniqSorted(findings.pages);
findings.components = uniqSorted(findings.components);
findings.firebaseClient = uniqSorted(findings.firebaseClient);
findings.firebaseAdmin = uniqSorted(findings.firebaseAdmin);
findings.cookiesUsage = uniqSorted(findings.cookiesUsage);
findings.ticketsFormsFields.sort((a,b)=>a.file.localeCompare(b.file));

// sanity problems
for (const route of findings.apiRoutes) {
  const txt = readSafe(path.join(ROOT, route));
  if (txt.includes('requireAuth(request)') && !txt.includes('NextRequest')) {
    findings.problems.push(`API route ${route} calls requireAuth(request) but does not import/use NextRequest. Consider (req as any) or updating types.`);
  }
}

// --- render
function h2(s){ return `\n## ${s}\n`; }

let report = [];
report.push(`# Repository Analysis`);
report.push(`_Scanned from:_ \`${ROOT}\``);

report.push(h2('Overview'));
report.push(`- Files scanned: **${files.length}**`);
report.push(`- API routes: **${findings.apiRoutes.length}**`);
report.push(`- Pages: **${findings.pages.length}**`);
report.push(`- Components: **${findings.components.length}**`);
report.push(`- Client Firestore usage (to migrate off in client): **${findings.firebaseClient.length}**`);
report.push(`- Server firebase-admin usage: **${findings.firebaseAdmin.length}**`);

report.push(h2('API Routes (src/app/api/**/route.*)'));
report.push(findings.apiRoutes.map(f=>`- ${f}`).join('\n') || '_none_');

report.push(h2('Pages (src/app/**/page.*)'));
report.push(findings.pages.map(f=>`- ${f}`).join('\n') || '_none_');

report.push(h2('Components (src/components/**)'));
report.push(findings.components.slice(0,200).map(f=>`- ${f}`).join('\n') || '_none_');
if (findings.components.length > 200) report.push(`…and ${findings.components.length-200} more`);

report.push(h2('Client Firestore usage (migrate to API)'));
report.push(findings.firebaseClient.map(f=>`- ${f}`).join('\n') || '_none_');

report.push(h2('Server firebase-admin usage'));
report.push(findings.firebaseAdmin.map(f=>`- ${f}`).join('\n') || '_none_');

report.push(h2('Auth Guards'));
report.push(findings.authGuards.map(r=>`- ${r.file} — requireAuth:${r.requireAuth?'✅':'❌'}, requireRole:${r.requireRole?'✅':'❌'}, NextRequest import:${r.mentionsNextRequest?'✅':'❌'}`).join('\n') || '_none_');

report.push(h2('Cookies / Headers usage'));
report.push(findings.cookiesUsage.map(f=>`- ${f}`).join('\n') || '_none_');

report.push(h2('ENV Keys Referenced'));
const envLines = Array.from(findings.envReferences.entries())
  .sort((a,b)=>a[0].localeCompare(b[0]))
  .map(([k,c])=>`- \`${k}\` × ${c}`);
report.push(envLines.join('\n') || '_none_');

report.push(h2('Tickets / Forms / Fields — where mentioned'));
report.push(findings.ticketsFormsFields.map(x=>`- ${x.file} — ${Array.from(new Set(x.mentions)).join(', ')}`).join('\n') || '_none_');

report.push(h2('Potential Problems / TODOs'));
report.push(findings.problems.map(p=>`- ${p}`).join('\n') || '_none_');

// write
fs.writeFileSync(OUT, report.join('\n'));
console.log('Wrote', OUT);
