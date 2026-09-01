import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, unauthorizedResponse } from './utils';
import { ZodError } from 'zod';
import { validationErrorResponse } from './utils';

type RouteHandler = (
  request: NextRequest,
  context?: any,
) => Promise<NextResponse>;

interface HandlerOptions {
  requireAuth?: boolean;
  methods?: string[];
}

/**
 * Wraps an API route handler with standardized error handling.
 * Catches ZodError, generic Error, and unexpected errors.
 */
export function withErrorHandler(handler: RouteHandler, options: HandlerOptions = {}): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      // Method check
      if (options.methods && !options.methods.includes(request.method)) {
        return NextResponse.json(
          { success: false, error: `Method ${request.method} not allowed` },
          { status: 405 },
        );
      }

      return await handler(request, context);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(error);
      }
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          return unauthorizedResponse();
        }
        return errorResponse(error.message);
      }
      return errorResponse('Internal server error', 500);
    }
  };
}
