"use server";

import { auth } from "@/auth";
import { revalidateTag } from "next/cache";
import {
  getWishlist,
  getWishlistProductIds,
  isInWishlist,
  addToWishlist as addToWishlistService,
  removeFromWishlist as removeFromWishlistService,
  toggleWishlist as toggleWishlistService,
  clearWishlist as clearWishlistService,
} from "@/features/wishlist/services/wishlist.service";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getUserWishlist() {
  try {
    const userId = await requireUser();
    return await getWishlist(userId);
  } catch (error: any) {
    if (error.message === "Unauthorized") return [];
    console.error("Error fetching wishlist:", error);
    return [];
  }
}

export async function fetchWishlistIds() {
  try {
    const userId = await requireUser();
    return await getWishlistProductIds(userId);
  } catch {
    return [];
  }
}

export async function checkIsInWishlist(productId: string) {
  try {
    const userId = await requireUser();
    return await isInWishlist(userId, productId);
  } catch {
    return false;
  }
}

export async function addToWishlist(productId: string) {
  try {
    const userId = await requireUser();
    const result = await addToWishlistService(userId, productId);
    revalidateTag("wishlist");
    return { success: true, ...result };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      throw new Error("Please sign in to use your wishlist");
    }
    console.error("Error adding to wishlist:", error);
    throw new Error(error.message || "Failed to add to wishlist");
  }
}

export async function removeFromWishlist(productId: string) {
  try {
    const userId = await requireUser();
    const result = await removeFromWishlistService(userId, productId);
    revalidateTag("wishlist");
    return { success: true, ...result };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      throw new Error("Please sign in to use your wishlist");
    }
    console.error("Error removing from wishlist:", error);
    throw new Error(error.message || "Failed to remove from wishlist");
  }
}

export async function toggleWishlist(productId: string) {
  try {
    const userId = await requireUser();
    const result = await toggleWishlistService(userId, productId);
    revalidateTag("wishlist");
    return { success: true, ...result };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      throw new Error("Please sign in to use your wishlist");
    }
    console.error("Error toggling wishlist:", error);
    throw new Error(error.message || "Failed to update wishlist");
  }
}

export async function clearWishlist() {
  try {
    const userId = await requireUser();
    await clearWishlistService(userId);
    revalidateTag("wishlist");
    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      throw new Error("Please sign in to use your wishlist");
    }
    console.error("Error clearing wishlist:", error);
    throw new Error(error.message || "Failed to clear wishlist");
  }
}

export async function mergeGuestWishlist(productIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { merged: false };
    const userId = session.user.id;

    for (const productId of productIds) {
      try {
        await addToWishlistService(userId, productId);
      } catch {
        // Skip duplicates or invalid products
      }
    }

    revalidateTag("wishlist");
    return { merged: true };
  } catch (error: any) {
    console.error("Error merging guest wishlist:", error);
    return { merged: false, error: error.message };
  }
}
