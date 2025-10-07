import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function deleteCookie(name: string) {
  // expire now; mirror default cookie scope
  // (adjust domain/secure if you set them on write)
  return {
    name,
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    expires: new Date(0),
  };
}

async function handler() {
  const jar = await cookies(); // Next 15: cookies() is async

  // Clear the 3 impersonation cookies we use in tests
  const toDelete = [
    deleteCookie('impersonatorToken'),
    deleteCookie('impersonatorUid'),
    // a boolean flag some UIs read to show the “impersonating” banner
    { ...deleteCookie('impersonating'), httpOnly: false },
  ];

  for (const c of toDelete) {
    jar.set(c);
  }

  return NextResponse.json({ ok: true, message: 'Stopped impersonating.' });
}

// Support both GET (links/buttons) and POST (forms/XHR)
export const GET = handler;
export const POST = handler;
