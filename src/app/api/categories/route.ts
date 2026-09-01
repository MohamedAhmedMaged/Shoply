import { getCategories, createCategory } from '@/features/products/services/product.service';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const categories = await getCategories();
    return successResponse(categories);
  } catch {
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    if (user.role === 'CUSTOMER') return errorResponse('Forbidden', 403);

    const { name } = await request.json();
    if (!name || typeof name !== 'string') {
      return errorResponse('Name is required', 400);
    }

    const category = await createCategory({ name });
    return successResponse(category, 201);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 400);
    return errorResponse('Internal server error', 500);
  }
}
