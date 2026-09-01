import { getAuthUser, requireRole } from '@/lib/auth';
import { getSellerOrders } from '@/features/seller/services/seller.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ['SELLER', 'ADMIN']);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const orders = await getSellerOrders(user.userId, page);
    return successResponse(orders);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse('Internal server error', 500);
  }
}
