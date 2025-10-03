
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

// Basic validation for email inputs
const validateEmailInput = (input: { to?: string; subject?: string; html?: string }): boolean => {
  return !!(input.to && input.subject && input.html);
};

export async function POST(req: Request) {
  try {
    // 1. Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, error: 'Not authenticated. No auth header.' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the token to ensure it's a valid user making the request
    // You could add more granular checks here (e.g., specific roles) if needed.
    await adminAuth.verifyIdToken(idToken);

    // 2. Parse and validate the request body
    const { to, subject, html } = await req.json();

    if (!validateEmailInput({ to, subject, html })) {
        return NextResponse.json({ ok: false, error: 'Invalid request: "to", "subject", and "html" are required.' }, { status: 400 });
    }

    // 3. Configure the Nodemailer transport
    // IMPORTANT: In a real app, these credentials should come from environment variables.
    // They are hardcoded here only for this prototype's simplicity.
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // 4. Send the email
    await transporter.sendMail({
      from: `"TenantCheck" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });

    return NextResponse.json({ ok: true, success: true, message: 'Email sent successfully.' });

  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ ok: false, error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: 'Failed to send email.', message: error.message }, { status: 500 });
  }
}

