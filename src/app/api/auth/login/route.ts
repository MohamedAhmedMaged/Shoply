import { NextRequest } from 'next/server';
import { loginUser } from '@/features/auth/services/auth.service';
import { loginSchema } from '@/lib/validators';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils';
import { ZodError } from 'zod';
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit';

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, maxRequests: 5 };

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const key = getRateLimitKey(ip, 'login');
    const result = await rateLimit(key, RATE_LIMIT);

    if (!result.allowed) {
      return errorResponse('Too many login attempts. Please try again later.', 429);
    }

    const body = await request.json();
    const validated = loginSchema.parse(body);
    const loginResult = await loginUser(validated);

    return successResponse(loginResult);
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    if (error instanceof Error) return errorResponse(error.message, 401);
    return errorResponse('Internal server error', 500);
  }
}
