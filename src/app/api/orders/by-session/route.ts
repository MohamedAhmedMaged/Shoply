import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Order } from "@/models";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return errorResponse("sessionId required", 400);

    await connectDB();
    const order = await Order.findOne({ stripeSessionId: sessionId })
      .select("orderNumber userId")
      .lean<any>();
    if (!order) return notFoundResponse("Order");

    if (order.userId.toString() !== user.userId && user.role !== "ADMIN") {
      return forbiddenResponse();
    }

    return successResponse({ orderNumber: order.orderNumber });
  } catch (err) {
    if (err instanceof Error) return errorResponse(err.message);
    return errorResponse("Internal server error", 500);
  }
}
