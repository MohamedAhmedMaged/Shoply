import mongoose from 'mongoose';
import { getProductBySlug, getProductById } from '@/features/products/services/product.service';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils';

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // Determine if the param is a MongoDB ObjectId or a slug
    const param = params.slug;
    const isObjectId = mongoose.isValidObjectId(param);

    let product;
    if (isObjectId) {
      product = await getProductById(param);
    } else {
      product = await getProductBySlug(param);
    }

    return successResponse(product);
  } catch (error) {
    if (error instanceof Error && error.message === 'Product not found') return notFoundResponse('Product');
    return errorResponse('Internal server error', 500);
  }
}
