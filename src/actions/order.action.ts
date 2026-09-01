"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { Cart } from "@/models";
import { revalidateTag } from "next/cache";
import { checkout as checkoutService } from "@/features/cart/services/cart.service";
import { checkoutSchema, CheckoutInput } from "@/lib/validators";
import { InsufficientStockError, InactiveProductError } from "@/features/inventory/inventory.service";

export async function createOrder(data: {
  paymentMethod: "STRIPE" | "COD";
  shippingAddress: Record<string, any>;
  email: string;
  couponCode?: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");

    await connectDB();
    const { default: User } = await import("@/models/User");
    const userDoc = await User.findById(userId).select("emailVerified");
    if (userDoc && !userDoc.emailVerified) {
      throw new Error("Please verify your email address before placing an order.");
    }

    const validated = checkoutSchema.parse(data);
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new Error("Cart not found");

    const result = await checkoutService(validated as CheckoutInput, userId);

    revalidateTag("orders");
    revalidateTag("cart");
    return result;
  } catch (error: any) {
    if (error instanceof InsufficientStockError) {
      throw new Error(
        `Not enough stock for one of the items. Only ${error.available} available.`,
      );
    }
    if (error instanceof InactiveProductError) {
      throw new Error("One of the items in your cart is no longer available.");
    }
    console.error("Error creating order:", error);
    throw new Error(error.message || "Failed to create order");
  }
}
