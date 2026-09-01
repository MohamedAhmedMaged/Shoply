import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { verifyEmailSchema } from '@/lib/validators';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils';
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit';
import { consumeVerificationToken } from '@/lib/verification';

const RATE_LIMIT = { windowMs: 10 * 60 * 1000, maxRequests: 20 };

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const key = getRateLimitKey(ip, 'verify-email');
    const limitResult = await rateLimit(key, RATE_LIMIT);
    if (!limitResult.allowed) {
      return errorResponse('Too many attempts. Please try again later.', 429);
    }

    const body = await request.json();
    const { token } = verifyEmailSchema.parse(body);

    const result = await consumeVerificationToken(token);

    if (!result.ok) {
      if (result.reason === 'expired') {
        return errorResponse('Verification link has expired. Please request a new one.', 410);
      }
      if (result.reason === 'already-verified') {
        return successResponse({ alreadyVerified: true }, 200);
      }
      return errorResponse('Invalid or expired verification token.', 400);
    }

    return successResponse({ verified: true, userId: result.userId }, 200);
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    if (error instanceof Error) return errorResponse(error.message, 400);
    return errorResponse('Internal server error', 500);
  }
}
