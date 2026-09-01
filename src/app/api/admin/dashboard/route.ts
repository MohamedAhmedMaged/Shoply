import { getAuthUser, requireRole } from "@/lib/auth";
import { getDashboardStats } from "@/features/admin/services/admin.service";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ["ADMIN"]);
    const stats = await getDashboardStats();
    return successResponse(stats);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse("Internal server error", 500);
  }
}
