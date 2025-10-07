import { NextResponse } from 'next/server';
import { addValidationJob, listValidationJobs } from '@/lib/validation-jobs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get('ticketId');
  if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
  const items = await listValidationJobs(ticketId);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
    const { id } = await addValidationJob(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
