import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { contactSchema } from '@/lib/validators';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils';
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit';
import { sendContactEmail, sendContactAutoReply } from '@/lib/email';

const RATE_LIMIT = { windowMs: 10 * 60 * 1000, maxRequests: 5 };

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const key = getRateLimitKey(ip, 'contact');
    const limitResult = await rateLimit(key, RATE_LIMIT);

    if (!limitResult.allowed) {
      return errorResponse('Too many contact submissions. Please try again later.', 429);
    }

    const body = await request.json();
    const validated = contactSchema.parse(body);

    try {
      await sendContactEmail(validated);
    } catch (err) {
      console.error('Contact email failed:', err);
      return errorResponse('Failed to send message. Please try again later.', 502);
    }

    sendContactAutoReply({ name: validated.name, email: validated.email }).catch((err) => {
      console.error('Contact auto-reply failed:', err);
    });

    return successResponse({ sent: true }, 200);
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    if (error instanceof Error) return errorResponse(error.message, 400);
    return errorResponse('Internal server error', 500);
  }
}
