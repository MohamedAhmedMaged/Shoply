import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  getOrCreateCart,
  addToCart,
  removeCartItem,
  updateCartItem,
} from "@/features/cart/services/cart.service";
import { cartItemSchema } from "@/lib/validators";
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/utils";
import { z, ZodError } from "zod";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { Cart, CartItem } from "@/models";
import mongoose from "mongoose";

async function resolveCartContext(request: NextRequest) {
  const user = await getAuthUser(request);
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guestId")?.value;
  return { user, guestId };
}

async function ownsCartItem(
  cartItemId: string,
  userId: string | undefined,
  guestId: string | undefined,
): Promise<boolean> {
  if (!mongoose.isValidObjectId(cartItemId)) return false;
  await connectDB();
  const item = await CartItem.findById(cartItemId).select("cartId").lean<any>();
  if (!item) return false;
  const cart = await Cart.findById(item.cartId).select("userId guestId").lean<any>();
  if (!cart) return false;
  if (userId) {
    return cart.userId?.toString() === userId;
  }
  if (guestId) {
    return cart.guestId === guestId;
  }
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { user, guestId } = await resolveCartContext(request);
    const cart = await getOrCreateCart(user?.userId, guestId);
    return successResponse(cart);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, guestId: existingGuestId } = await resolveCartContext(request);
    let guestId = existingGuestId;
    if (!user && !guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }

    const body = await request.json();
    const validated = cartItemSchema.parse(body);
    const cart = await addToCart(validated, user?.userId, guestId);

    const response = successResponse(cart);
    if (!user && guestId) {
      response.cookies.set("guestId", guestId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }
    return response;
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse("Internal server error", 500);
  }
}

const patchSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
});

export async function DELETE(request: NextRequest) {
  try {
    const { user, guestId } = await resolveCartContext(request);
    if (!user && !guestId) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get("cartItemId");
    const productId = searchParams.get("productId");
    if (!cartItemId && !productId) return errorResponse("Cart item ID or product ID required", 400);

    let targetItemId = cartItemId;
    if (!targetItemId || !mongoose.isValidObjectId(targetItemId)) {
      const resolvedProductId = productId || (cartItemId && cartItemId.includes("_") ? cartItemId.split("_")[1] : null);
      if (resolvedProductId && mongoose.isValidObjectId(resolvedProductId)) {
        await connectDB();
        const cart = await Cart.findOne(user ? { userId: user.userId } : { guestId }).lean<any>();
        if (cart) {
          const found = await CartItem.findOne({ cartId: cart._id, productId: resolvedProductId }).lean<any>();
          if (found) targetItemId = found._id.toString();
        }
      }
    }

    if (!targetItemId || !(await ownsCartItem(targetItemId, user?.userId, guestId))) {
      return forbiddenResponse();
    }

    await removeCartItem(targetItemId);
    const cart = await getOrCreateCart(user?.userId, guestId);
    return successResponse(cart);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, guestId } = await resolveCartContext(request);
    if (!user && !guestId) return unauthorizedResponse();

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);
    const { cartItemId, quantity } = parsed.data;

    if (!(await ownsCartItem(cartItemId, user?.userId, guestId))) {
      return forbiddenResponse();
    }

    await updateCartItem(cartItemId, quantity);
    const cart = await getOrCreateCart(user?.userId, guestId);
    return successResponse(cart);
  } catch (error) {
    if (error instanceof Error) return errorResponse(error.message);
    return errorResponse("Internal server error", 500);
  }
}
