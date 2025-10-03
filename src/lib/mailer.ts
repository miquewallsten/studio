type Mail = { to: string; subject: string; html?: string; text?: string };

export async function sendMail(msg: Mail) {
  if (process.env.NODE_ENV !== 'production' || process.env.ADMIN_FAKE === '1') {
    console.log('[MAIL:DEV]', JSON.stringify(msg));
    return { ok: true, dev: true };
  }
  // TODO: wire real provider (SES/SendGrid/etc)
  throw new Error('sendMail: no provider configured');
}
