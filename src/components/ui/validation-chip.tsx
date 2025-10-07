'use client';

import { Badge } from '@/components/ui/badge';

type Props = {
  status?: 'pending' | 'success' | 'fail' | 'error';
  level?: 'hard' | 'soft';
  compact?: boolean;
};

const labelMap: Record<NonNullable<Props['status']>, string> = {
  pending: 'Checking…',
  success: 'Verified',
  fail: 'Needs review',
  error: 'Error',
};

export function ValidationChip({ status = 'pending', level = 'soft', compact }: Props) {
  const text = labelMap[status];
  const tone =
    status === 'success' ? 'bg-green-600' :
    status === 'fail' ? (level === 'hard' ? 'bg-red-600' : 'bg-amber-500') :
    status === 'error' ? 'bg-rose-600' :
    'bg-slate-500';

  return (
    <Badge className={`${tone} text-white ${compact ? 'text-xs px-1.5 py-0.5' : ''}`}>
      {text}{level === 'hard' && status !== 'success' ? ' (hard)' : ''}
    </Badge>
  );
}
