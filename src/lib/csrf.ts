import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a CSRF token and set it as a cookie.
 * The client should read this cookie and send it back as the X-CSRF-Token header.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Set the CSRF token cookie on a response.
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });
}

/**
 * Validate a CSRF token from the request header against the cookie.
 * For API routes: read from header and cookie.
 * For Server Actions: CSRF is not needed because SameSite cookies + POST-only.
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!headerToken || !cookieToken) {
    return false;
  }

  const headerBuf = Buffer.from(headerToken);
  const cookieBuf = Buffer.from(cookieToken);

  if (headerBuf.length !== cookieBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(headerBuf, cookieBuf);
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
