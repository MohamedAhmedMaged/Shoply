import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { resendVerificationSchema } from '@/lib/validators';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils';
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { sendVerificationForUser } from '@/lib/verification';

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, maxRequests: 3 };

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const key = getRateLimitKey(ip, 'resend-verification');
    const limitResult = await rateLimit(key, RATE_LIMIT);
    if (!limitResult.allowed) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    const body = await request.json();
    const { email } = resendVerificationSchema.parse(body);

    await connectDB();
    const user = await User.findOne({ email }).select('_id emailVerified');
    if (!user) {
      return successResponse({ sent: true }, 200);
    }

    if (user.emailVerified) {
      return successResponse({ alreadyVerified: true }, 200);
    }

    const result = await sendVerificationForUser(user._id.toString());
    if (!result.ok) {
      if (result.reason === 'Email already verified') {
        return successResponse({ alreadyVerified: true }, 200);
      }
      console.error('Resend verification failed:', result.reason);
      return errorResponse('Could not send verification email. Please try again later.', 502);
    }

    return successResponse({ sent: true }, 200);
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    if (error instanceof Error) return errorResponse(error.message, 400);
    return errorResponse('Internal server error', 500);
  }
}
