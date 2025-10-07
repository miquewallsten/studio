'use client';

import { useState, useCallback } from 'react';

type Rule = { validatorId: string; level: 'hard' | 'soft' };
type FieldRef = { id: string; label: string; validations?: Rule[] };

type RunArgs = {
  ticketId: string;
  field: FieldRef;
  value: unknown;
  context?: Record<string, unknown>;
  ranBy?: { uid?: string; role?: string };
};

type Status = 'idle' | 'running' | 'success' | 'fail' | 'error';

export function useFieldValidation() {
  const [status, setStatus] = useState<Status>('idle');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | undefined>();

  const run = useCallback(async ({ ticketId, field, value, context, ranBy }: RunArgs) => {
    setStatus('running');
    setError(undefined);
    setResults([]);

    // 1) Hit central validator
    const res = await fetch('/api/fields/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value, context }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus('error');
      setError(payload?.error || 'Validation failed');
      return { ok: false, results: [] as any[] };
    }

    const items: any[] = payload.results || [];
    setResults(items);

    // 2) Persist audit jobs (fire-and-forget)
    for (const it of items) {
      void fetch('/api/validation-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          fieldId: field.id,
          fieldLabel: field.label,
          validatorId: it?.rule?.validatorId,
          level: it?.rule?.level,
          status: it?.result?.status,       // 'success' | 'fail' | 'error'
          summary: it?.result?.summary,
          evidence: it?.result?.evidence,
          links: it?.result?.links,
          warnings: it?.result?.warnings,
          errors: it?.result?.errors,
          ranBy,
        }),
      }).catch(() => {});
    }

    // 3) Derive overall status for the chip
    const hardFail = items.find(r =>
      r?.rule?.level === 'hard' && (r?.result?.status === 'fail' || r?.result?.status === 'error')
    );
    const softFail = items.find(r => r?.result?.status === 'fail');

    if (hardFail) setStatus('fail');
    else if (softFail) setStatus('fail');
    else setStatus('success');

    return { ok: true, results: items };
  }, []);

  return { status, results, error, run };
}
