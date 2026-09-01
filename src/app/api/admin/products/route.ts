import { getAuthUser, requireRole } from '@/lib/auth';
import { adminGetAllProducts, adminUpdateProduct } from '@/features/admin/services/admin.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ['ADMIN']);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const result = await adminGetAllProducts(page);
    return successResponse(result);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ['ADMIN']);
    const { productId, isActive } = await request.json();
    const updated = await adminUpdateProduct(productId, { isActive });
    return successResponse(updated);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse('Internal server error', 500);
  }
}
