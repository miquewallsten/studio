import { NextResponse } from 'next/server';
import { runValidator } from '@/lib/validators/registry';
import type { ValidatorId, ValidatorInput } from '@/types/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { validatorId, fieldId, fieldLabel, value, context } = body || {};
    if (!validatorId || !fieldId) {
      return NextResponse.json({ error: 'validatorId and fieldId are required' }, { status: 400 });
    }
    const input: ValidatorInput = { fieldId, fieldLabel, value, context };
    const result = await runValidator(validatorId as ValidatorId, input);
    return NextResponse.json({ result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
