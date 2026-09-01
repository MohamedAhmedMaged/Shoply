import { getAuthUser } from '@/lib/auth';
import { getUserProfile } from '@/features/auth/services/auth.service';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/utils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();

    const profile = await getUserProfile(user.userId);
    return successResponse(profile);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 404);
    return errorResponse('Internal server error', 500);
  }
}
