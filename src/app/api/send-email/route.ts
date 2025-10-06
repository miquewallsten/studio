import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authApi';
import { sendMail } from '@/lib/mailer';

export const runtime = 'nodejs';

// Basic validation for email inputs
const validateEmailInput = (input: { to?: string; subject?: string; html?: string }): boolean => {
  return !!(input.to && input.subject && input.html);
};

export async function POST(req: Request) {
  try {
    // 1. Authenticate the request
    await requireAuth(req as any);

    // 2. Parse and validate the request body
    const { to, subject, html } = await req.json();

    if (!validateEmailInput({ to, subject, html })) {
        return NextResponse.json({ ok: false, error: 'Invalid request: "to", "subject", and "html" are required.' }, { status: 400 });
    }

    // 3. Send the email using the mailer interface
    await sendMail({ to, subject, html });

    return NextResponse.json({ ok: true, success: true, message: 'Email sent successfully.' });

  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ ok: false, error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: 'Failed to send email.', message: error.message }, { status: 500 });
  }
}
