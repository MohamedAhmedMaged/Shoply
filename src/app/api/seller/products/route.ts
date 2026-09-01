import { getAuthUser, requireRole } from '@/lib/auth';
import { getSellerProducts, updateStock } from '@/features/seller/services/seller.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ['SELLER', 'ADMIN']);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const products = await getSellerProducts(user.userId, page);
    return successResponse(products);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ['SELLER', 'ADMIN']);
    const { productId, stock } = await request.json();
    const product = await updateStock(productId, user.userId, stock);
    return successResponse(product);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse('Internal server error', 500);
  }
}
