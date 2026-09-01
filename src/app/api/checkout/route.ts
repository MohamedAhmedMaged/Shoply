import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { checkout } from '@/features/cart/services/cart.service';
import { checkoutSchema } from '@/lib/validators';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from '@/lib/utils';
import { ZodError } from 'zod';
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit';
import { validateCsrfToken } from '@/lib/csrf';

const RATE_LIMIT = { windowMs: 10 * 60 * 1000, maxRequests: 10 };

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const key = getRateLimitKey(ip, 'checkout');
    const limitResult = await rateLimit(key, RATE_LIMIT);

    if (!limitResult.allowed) {
      return errorResponse('Too many checkout attempts. Please try again later.', 429);
    }

    if (!validateCsrfToken(request)) {
      return errorResponse('Invalid CSRF token', 403);
    }

    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();

    const { default: User } = await import("@/models/User");
    const userDoc = await User.findById(user.userId).select("emailVerified");
    if (userDoc && !userDoc.emailVerified) {
      return errorResponse("Please verify your email address before placing an order.", 403);
    }

    const body = await request.json();
    const validated = checkoutSchema.parse(body);
    const result = await checkout(validated, user.userId, body.idempotencyKey);

    return successResponse(result);
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
