import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { OrderStatusHistory, Order } from '@/models';
import { getAuthUser } from '@/lib/auth';
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorizedResponse();

    await connectDB();
    const order = await Order.findById(params.id);
    if (!order) return notFoundResponse('Order');

    // Only allow the order owner or admin to view timeline
    if (order.userId.toString() !== user.userId && user.role !== 'ADMIN') {
      return unauthorizedResponse();
    }

    const history = await OrderStatusHistory.find({ orderId: params.id })
      .sort({ createdAt: 1 })
      .lean();

    const data = history.map((h: any) => ({
      id: h._id.toString(),
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      changedBy: h.changedBy,
      note: h.note,
      createdAt: h.createdAt?.toISOString() || null,
    }));

    return successResponse(data);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
