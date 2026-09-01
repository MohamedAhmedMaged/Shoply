import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Cart, CartItem, Order } from '@/models';
import { sendAbandonedCartEmail } from '@/lib/email';
import { APP_URL } from '@/lib/config';
import { getAuthUser, requireRole } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils';

const ABANDONMENT_HOURS = 24;

export async function POST(_request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorizedResponse();
    requireRole(user, ['ADMIN']);

    await connectDB();

    const cutoff = new Date(Date.now() - ABANDONMENT_HOURS * 60 * 60 * 1000);

    const abandonedCarts = await Cart.find({
      userId: { $exists: true },
      lastActiveAt: { $lt: cutoff },
    })
      .populate('userId', 'email name')
      .lean();

    let recovered = 0;
    let skipped = 0;

    for (const cart of abandonedCarts as any[]) {
      try {
        if (!cart.userId?._id) {
          skipped++;
          continue;
        }

        const hasOrder = await Order.findOne({
          userId: cart.userId._id,
          createdAt: { $gt: cart.lastActiveAt },
        });

        if (hasOrder) {
          skipped++;
          continue;
        }

        const cartItems = await CartItem.find({ cartId: cart._id })
          .populate('productId', 'name price images isActive')
          .lean();

        const validItems = cartItems.filter(
          (item: any) => item.productId && item.productId.isActive,
        );

        if (validItems.length === 0) {
          skipped++;
          continue;
        }

        const items = validItems.map((item: any) => ({
          name: item.productId.name,
          price: item.productId.price,
          quantity: item.quantity,
          image: item.productId.images?.[0] || '',
        }));

        const total = validItems.reduce(
          (sum: number, item: any) => sum + item.productId.price * item.quantity,
          0,
        );

        const userRecord = cart.userId;
        const checkoutUrl = `${APP_URL}/checkout`;

        await sendAbandonedCartEmail(
          userRecord.email,
          userRecord.name || 'there',
          items,
          total,
          checkoutUrl,
        );

        await Cart.findByIdAndUpdate(cart._id, { lastActiveAt: new Date() });
        recovered++;
      } catch (err) {
        console.error(`Failed to process cart ${cart._id}:`, err);
        skipped++;
      }
    }

    return successResponse({ recovered, skipped, total: recovered + skipped });
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
