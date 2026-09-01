import { getAuthUser, requireRole } from "@/lib/auth";
import {
  adminGetAllOrders,
  adminUpdateOrderStatus,
} from "@/features/admin/services/admin.service";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/utils";
import { NextRequest } from "next/server";
import { OrderStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();
    requireRole(user, ["ADMIN"]);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const result = await adminGetAllOrders(page);
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
    const { orderId, status } = await request.json();
    const updated = await adminUpdateOrderStatus(
      orderId,
      status as OrderStatus,
    );
    return successResponse(updated);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message, 403);
    return errorResponse("Internal server error", 500);
  }
}
