import { NextRequest } from 'next/server';
import { validateCoupon } from '@/features/coupons/services/coupon.service';
import { getAuthUser } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Cart, CartItem } from '@/models';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return errorResponse('Coupon code is required', 400);
    }

    await connectDB();
    const cartDoc = await Cart.findOne({ userId: user.userId });
    if (!cartDoc) return errorResponse('Cart not found', 404);

    const cartItems = await CartItem.find({ cartId: cartDoc._id }).populate('productId');
    if (cartItems.length === 0) return errorResponse('Cart is empty', 400);

    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + (item.productId?.price || 0) * item.quantity,
      0,
    );

    const result = await validateCoupon(code, user.userId, subtotal);
    return successResponse(result);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
