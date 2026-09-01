import { NextRequest } from 'next/server';
import { getProducts } from '@/features/products/services/product.service';
import { successResponse, errorResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minPriceRaw = searchParams.get('minPrice');
    const maxPriceRaw = searchParams.get('maxPrice');
    const minPrice = minPriceRaw !== null && minPriceRaw !== '' ? Number(minPriceRaw) : undefined;
    const maxPrice = maxPriceRaw !== null && maxPriceRaw !== '' ? Number(maxPriceRaw) : undefined;

    if (minPrice !== undefined && Number.isNaN(minPrice)) {
      return errorResponse('minPrice must be a valid number', 400);
    }
    if (maxPrice !== undefined && Number.isNaN(maxPrice)) {
      return errorResponse('maxPrice must be a valid number', 400);
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return errorResponse('minPrice cannot be greater than maxPrice', 400);
    }

    const filters = {
      category: searchParams.get('category') || undefined,
      minPrice,
      maxPrice,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as 'price' | 'createdAt' | 'name' | 'discount') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      deals: searchParams.get('deals') === 'true' || undefined,
    };
    const result = await getProducts(filters);
    return successResponse(result);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
