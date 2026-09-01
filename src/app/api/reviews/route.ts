import { getAuthUser } from '@/lib/auth';
import { getProductReviews, createReview, deleteReview } from '@/features/reviews/services/review.service';
import { reviewSchema } from '@/lib/validators';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/utils';
import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) return errorResponse('Product ID required');
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const reviews = await getProductReviews(productId, page, limit);
    return successResponse(reviews);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    const { productId, ...reviewData } = await request.json();
    const validated = reviewSchema.parse(reviewData);
    const review = await createReview(user.userId, productId, validated);
    return successResponse(review, 201);
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    if (!reviewId) return errorResponse('Review ID required');
    await deleteReview(user.userId, reviewId);
    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
