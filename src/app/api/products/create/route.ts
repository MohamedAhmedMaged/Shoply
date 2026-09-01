import { getAuthUser, requireRole } from '@/lib/auth';
import { createProduct } from '@/features/products/services/product.service';
import { productSchema } from '@/lib/validators';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse } from '@/lib/utils';
import { ZodError } from 'zod';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ['SELLER', 'ADMIN']);

    const body = await request.json();
    const validated = productSchema.parse(body);
    const product = await createProduct(user.userId, validated);
    return successResponse(product, 201);
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    if ((error as Error).message === 'Unauthorized') return unauthorizedResponse();
    if ((error as Error).message === 'Forbidden') return errorResponse('Forbidden', 403);
    return errorResponse('Internal server error', 500);
  }
}
