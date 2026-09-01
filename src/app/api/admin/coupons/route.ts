import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import { Coupon } from '@/models';
import { getAuthUser, requireRole } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorizedResponse();
    requireRole(user, ['ADMIN']);

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(),
    ]);

    const data = coupons.map((c: any) => ({
      id: c._id.toString(),
      code: c.code,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount,
      maxDiscount: c.maxDiscount || null,
      usageLimit: c.usageLimit,
      usedCount: c.usedCount,
      perUserLimit: c.perUserLimit,
      expiresAt: c.expiresAt?.toISOString() || null,
      isActive: c.isActive,
      createdAt: c.createdAt?.toISOString() || null,
    }));

    return successResponse({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorizedResponse();
    requireRole(user, ['ADMIN']);

    const body = await request.json();
    const { code, type, value, minOrderAmount, maxDiscount, usageLimit, perUserLimit, expiresAt } = body;

    if (!code || !type || value === undefined || !expiresAt) {
      return errorResponse('Missing required fields: code, type, value, expiresAt', 400);
    }

    if (!['PERCENTAGE', 'FIXED'].includes(type)) {
      return errorResponse('Type must be PERCENTAGE or FIXED', 400);
    }

    if (value <= 0) {
      return errorResponse('Value must be positive', 400);
    }

    if (type === 'PERCENTAGE' && value > 100) {
      return errorResponse('Percentage value cannot exceed 100', 400);
    }

    await connectDB();

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return errorResponse('A coupon with this code already exists', 409);
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount: maxDiscount || undefined,
      usageLimit: usageLimit || 0,
      perUserLimit: perUserLimit || 1,
      expiresAt: new Date(expiresAt),
    });

    return successResponse({
      id: coupon._id.toString(),
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    }, 201);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorizedResponse();
    requireRole(user, ['ADMIN']);

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return errorResponse('Coupon ID is required', 400);

    await connectDB();
    const allowedFields = ['isActive', 'value', 'minOrderAmount', 'maxDiscount', 'usageLimit', 'perUserLimit', 'expiresAt'];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'expiresAt') {
          updateData[field] = new Date(updates[field]);
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!coupon) return errorResponse('Coupon not found', 404);

    return successResponse({ id });
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorizedResponse();
    requireRole(user, ['ADMIN']);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('Coupon ID is required', 400);

    await connectDB();
    await Coupon.findByIdAndDelete(id);

    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse('Internal server error', 500);
  }
}
