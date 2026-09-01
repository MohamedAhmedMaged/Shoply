import { getAuthUser, requireRole } from "@/lib/auth";
import {
  adminGetAllUsers,
  adminUpdateUserRole,
  adminDeleteUser,
} from "@/features/admin/services/admin.service";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/utils";
import { NextRequest } from "next/server";
import { Role } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ["ADMIN"]);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const result = await adminGetAllUsers(page);
    return successResponse(result);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ["ADMIN"]);
    const { userId, role } = await request.json();
    const updated = await adminUpdateUserRole(userId, role as Role);
    return successResponse(updated);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ["ADMIN"]);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return errorResponse("User ID required");
    await adminDeleteUser(userId);
    return successResponse({ success: true });
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse("Internal server error", 500);
  }
}
