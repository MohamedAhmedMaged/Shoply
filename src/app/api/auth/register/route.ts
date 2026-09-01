import { NextRequest } from 'next/server';
import { registerUser } from '@/features/auth/services/auth.service';
import { registerSchema } from '@/lib/validators';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils';
import { ZodError } from 'zod';
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit';

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, maxRequests: 3 };

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const key = getRateLimitKey(ip, 'register');
    const limitResult = await rateLimit(key, RATE_LIMIT);

    if (!limitResult.allowed) {
      return errorResponse('Too many registration attempts. Please try again later.', 429);
    }

    const body = await request.json();
    const validated = registerSchema.parse(body);
    const result = await registerUser(validated);

    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    if (error instanceof Error) return errorResponse(error.message, 409);
    return errorResponse('Internal server error', 500);
  }
}
