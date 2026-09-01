import { getAuthUser, requireRole } from '@/lib/auth';
import { getAllBanners, createBanner, updateBanner, deleteBanner } from '@/features/admin/services/admin.service';
import { bannerSchema } from '@/lib/validators';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/utils';
import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ['ADMIN']);
    const banners = await getAllBanners();
    return successResponse(banners);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ['ADMIN']);
    const body = await request.json();
    const validated = bannerSchema.parse(body);
    const banner = await createBanner(validated);
    return successResponse(banner, 201);
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ['ADMIN']);
    const { id, ...data } = await request.json();
    const banner = await updateBanner(id, data);
    return successResponse(banner);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ['ADMIN']);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('Banner ID required');
    await deleteBanner(id);
    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse('Internal server error', 500);
  }
}
