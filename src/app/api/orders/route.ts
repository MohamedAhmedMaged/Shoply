import { getAuthUser } from '@/lib/auth';
import { getUserOrders } from '@/features/orders/services/order.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const orders = await getUserOrders(user.userId, page, limit);
    return successResponse(orders);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
