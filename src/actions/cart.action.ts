"use server";

import { auth } from "@/auth";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import { CartItem, Cart } from "@/models";
import { revalidateTag } from "next/cache";
import {
  addToCart as addToCartService,
  updateCartItem as updateCartItemService,
  removeCartItem as removeCartItemService,
  mergeGuestCart as mergeGuestCartService,
} from "@/features/cart/services/cart.service";
import { cartItemSchema } from "@/lib/validators";

function generateGuestId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function resolveCartContext() {
  const session = await auth();
  const userId = session?.user?.id;
  const cookieStore = await cookies();
  let guestId = cookieStore.get("guestId")?.value;
  if (!userId && !guestId) guestId = generateGuestId();
  return { userId, guestId };
}

function setGuestCookieIfNeeded(guestId: string | undefined, userId: string | undefined) {
  if (userId || !guestId) return;
  try {
    cookies().set("guestId", guestId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  } catch {
    // cookies() can only be set during a Server Action or Route Handler write.
    // If the call originates from a read-only context we silently skip.
  }
}

export async function addToCart(input: {
  productId: string;
  quantity: number;
}) {
  try {
    const validated = cartItemSchema.parse(input);
    const { userId, guestId } = await resolveCartContext();
    const result = await addToCartService(validated, userId, guestId);
    setGuestCookieIfNeeded(guestId, userId);
    revalidateTag("cart");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error adding to cart:", error);
    throw new Error(error.message || "Failed to add to cart");
  }
}

export async function updateCartItem(cartItemId: string, quantity: number) {
  try {
    await updateCartItemService(cartItemId, quantity);
    revalidateTag("cart");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating cart item:", error);
    throw new Error(error.message || "Failed to update cart item");
  }
}

export async function removeCartItem(cartItemId: string) {
  try {
    await removeCartItemService(cartItemId);
    revalidateTag("cart");
    return { success: true };
  } catch (error: any) {
    console.error("Error removing cart item:", error);
    throw new Error(error.message || "Failed to remove cart item");
  }
}

export async function clearCart(cartId: string) {
  try {
    const { userId, guestId } = await resolveCartContext();
    await connectDB();

    const cart = await Cart.findById(cartId);
    if (!cart) throw new Error("Cart not found");

    if (userId && cart.userId?.toString() !== userId) {
      throw new Error("Unauthorized: You can only clear your own cart");
    }
    if (!userId && guestId && cart.guestId !== guestId) {
      throw new Error("Unauthorized: You can only clear your own cart");
    }

    await CartItem.deleteMany({ cartId });
    await Cart.findByIdAndUpdate(cartId, { items: [] });
    const { invalidateCache } = await import("@/lib/cache");
    if (cart.userId) invalidateCache(`cart:${cart.userId}`);
    revalidateTag("cart");
    return { success: true };
  } catch (error: any) {
    console.error("Error clearing cart:", error);
    throw new Error(error.message || "Failed to clear cart");
  }
}

export async function mergeGuestCartAfterLogin() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { merged: false };

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guestId")?.value;
    if (!guestId) return { merged: false };

    await mergeGuestCartService(guestId, userId);
    cookieStore.delete("guestId");
    revalidateTag("cart");
    return { merged: true };
  } catch (error: any) {
    console.error("Error merging guest cart:", error);
    return { merged: false, error: error.message };
  }
}
