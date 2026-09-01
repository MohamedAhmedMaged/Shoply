import { getAuthUser } from '@/lib/auth';
import { getWishlistCount } from '@/features/wishlist/services/wishlist.service';
import { successResponse, errorResponse } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthUser(_request);
    if (!user) return successResponse({ count: 0 });
    const count = await getWishlistCount(user.userId);
    return successResponse({ count });
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
