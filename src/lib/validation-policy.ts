export function canSubmitField(results: any[]): {allowed: boolean; reason?: string} {
  const hardFail = results.find(r => r.rule?.level==='hard' && (r.result?.status==='fail' || r.result?.status==='error'));
  if (hardFail) return { allowed: false, reason: hardFail.result?.summary || 'Hard validation failed' };
  return { allowed: true };
}
