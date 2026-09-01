import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Product } from '@/models';
import { successResponse, errorResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return successResponse([]);
    }

    await connectDB();

    const products = await Product.find({
      isActive: true,
      name: { $regex: q, $options: 'i' },
    })
      .select('name slug price images')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const data = products.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.images?.[0] || null,
    }));

    return successResponse(data);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
