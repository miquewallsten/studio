import type { ValidatorFn, ValidatorResult, ValidatorInput, ValidatorId } from '@/types/validation';

/**
 * Utilities: map simple errors to standard result.
 */
function err(summary: string, error?: unknown): ValidatorResult {
  return { status: 'error', summary, errors: [String(error ?? '')].filter(Boolean) };
}
function ok(summary: string, evidence?: Record<string, any>, links?: {label:string,url:string}[]): ValidatorResult {
  return { status: 'success', summary, evidence, links };
}
function fail(summary: string, evidence?: Record<string, any>, warnings?: string[]): ValidatorResult {
  return { status: 'fail', summary, evidence, warnings };
}

/**
 * Stub helpers – replace with real SDKs later.
 * Keep all vendor-specific code encapsulated here.
 */

// NameScan (PEP/Watchlists) — STUB
const namescanPep: ValidatorFn = async (input) => {
  // Example: call NameScan with input.value as full name.
  // TODO: inject API key from process.env.NAMESCAN_API_KEY
  // For now, simulate a pass with a link to dashboard search.
  const name = String(input.value ?? '').trim();
  if (!name) return fail('Name missing for screening');
  return ok(`No matches found for "${name}" (stub)`, { matches: [] }, [
    { label: 'NameScan', url: 'https://www.namescan.io' },
  ]);
};

// CURP (MX)
const curpLookup: ValidatorFn = async (input) => {
  const curp = String(input.value ?? '').toUpperCase();
  // Minimal CURP regex pre-validate (does not guarantee existence)
  const pattern = /^[A-Z]{4}\d{6}[A-Z]{6}\d{2}$/;
  if (!pattern.test(curp)) {
    return fail('Formato CURP inválido', { curp }, ['Patrón CURP no coincide']);
  }
  // TODO: call official source; for now return success stub
  return ok('CURP válido (formato). Fuente oficial pendiente (stub)', { curp });
};

// RFC (SAT MX)
const rfcLookup: ValidatorFn = async (input) => {
  const rfc = String(input.value ?? '').toUpperCase();
  const pattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  if (!pattern.test(rfc)) {
    return fail('Formato RFC inválido', { rfc }, ['Patrón RFC no coincide']);
  }
  // TODO: SAT verification (requires captcha/session in many flows) — external service / vendor gateway
  return ok('RFC con formato válido. Verificación SAT pendiente (stub)', { rfc });
};

// ZapSign (document signature status) — STUB
const zapSignDoc: ValidatorFn = async (input) => {
  const docId = String(input.value ?? '');
  if (!docId) return fail('ZapSign: Falta documento/ID');
  // TODO: call ZapSign API with API key, get status, signers, hashes, etc.
  return ok('Documento firmado (stub)', { documentId: docId, status: 'signed' });
};

const impls: Record<ValidatorId, ValidatorFn> = {
  'namescan.pep_screening': namescanPep,
  'curp.lookup': curpLookup,
  'rfc_sat.lookup': rfcLookup,
  'zapsign.doc_signature': zapSignDoc,
};

export function getValidator(id: ValidatorId): ValidatorFn {
  const fn = impls[id];
  if (!fn) throw new Error(`Unknown validator: ${id}`);
  return fn;
}

/** Run a single validator by id (helper) */
export async function runValidator(id: ValidatorId, input: ValidatorInput): Promise<ValidatorResult> {
  try {
    const fn = getValidator(id);
    return await fn(input);
  } catch (e) {
    return err(`Validator "${id}" failed`, e);
  }
}
