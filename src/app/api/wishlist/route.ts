import { getAuthUser } from '@/lib/auth';
import { getWishlist, addToWishlist, removeFromWishlist, clearWishlist } from '@/features/wishlist/services/wishlist.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    const wishlist = await getWishlist(user.userId);
    return successResponse(wishlist);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    const { productId } = await request.json();
    const item = await addToWishlist(user.userId, productId);
    return successResponse(item, 201);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (productId) {
      await removeFromWishlist(user.userId, productId);
    } else {
      await clearWishlist(user.userId);
    }
    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
