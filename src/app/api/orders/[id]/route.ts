import { getAuthUser } from '@/lib/auth';
import { getOrderById, cancelOrder } from '@/features/orders/services/order.service';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();

    const order = await getOrderById(params.id);
    if (order.userId) {
      if (order.userId !== user.userId && user.role !== 'ADMIN') {
        return forbiddenResponse();
      }
    } else {
      return forbiddenResponse();
    }
    return successResponse(order);
  } catch (error) {
    if (error instanceof Error && error.message === 'Order not found') return notFoundResponse('Order');
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json();

    // User cancelling their own order
    if (body.action === 'cancel') {
      const result = await cancelOrder(params.id, user.userId);
      return successResponse(result);
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
