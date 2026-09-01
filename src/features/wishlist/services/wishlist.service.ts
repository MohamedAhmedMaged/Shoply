import connectDB from "@/lib/db";
import mongoose from "mongoose";
import { WishlistItem, Product } from "@/models";
import { getCache, setCache, invalidateCache } from "@/lib/cache";

function isValidObjectId(id: string) {
  return mongoose.isValidObjectId(id);
}

function serializeItem(item: any) {
  return {
    id: item._id.toString(),
    userId: item.userId?.toString() || null,
    productId: item.productId
      ? {
          id: item.productId._id?.toString() || item.productId,
          name: item.productId.name,
          slug: item.productId.slug,
          price: item.productId.price,
          comparePrice: item.productId.comparePrice || null,
          images: item.productId.images || [],
          stock: item.productId.stock,
          category: item.productId.categoryId
            ? {
                name: item.productId.categoryId.name,
                slug: item.productId.categoryId.slug,
              }
            : null,
        }
      : null,
    createdAt: item.createdAt?.toString() || null,
  };
}

export async function getWishlist(userId: string) {
  await connectDB();
  const items = await WishlistItem.find({ userId })
    .populate({
      path: "productId",
      populate: { path: "categoryId", select: "name slug" },
    })
    .sort({ createdAt: -1 })
    .lean();

  return items
    .filter((item: any) => item.productId)
    .map(serializeItem);
}

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const cacheKey = `wishlist:ids:${userId}`;
  const cached = getCache<string[]>(cacheKey);
  if (cached) return cached;

  await connectDB();
  const items = await WishlistItem.find({ userId })
    .select("productId")
    .lean<any[]>();
  const ids = items
    .map((item) => item.productId?.toString())
    .filter((id): id is string => Boolean(id));
  setCache(cacheKey, ids, 30_000);
  return ids;
}

export async function getWishlistCount(userId: string): Promise<number> {
  const cacheKey = `wishlist:count:${userId}`;
  const cached = getCache<number>(cacheKey);
  if (cached !== null) return cached;

  await connectDB();
  const count = await WishlistItem.countDocuments({ userId });
  setCache(cacheKey, count, 30_000);
  return count;
}

export async function isInWishlist(userId: string, productId: string) {
  if (!isValidObjectId(productId)) return false;
  await connectDB();
  const item = await WishlistItem.findOne({ userId, productId })
    .select("_id")
    .lean<any>();
  return Boolean(item);
}

export async function addToWishlist(userId: string, productId: string) {
  if (!isValidObjectId(productId)) throw new Error("Invalid product ID");
  await connectDB();
  const product = await Product.findById(productId).select("_id").lean<any>();
  if (!product) throw new Error("Product not found");

  try {
    await WishlistItem.create({ userId, productId });
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
  }

  invalidateCache(`wishlist:${userId}`);
  return { wishlisted: true };
}

export async function removeFromWishlist(userId: string, productId: string) {
  if (!isValidObjectId(productId)) throw new Error("Invalid product ID");
  await connectDB();
  await WishlistItem.deleteOne({ userId, productId });
  invalidateCache(`wishlist:${userId}`);
  return { wishlisted: false };
}

export async function toggleWishlist(userId: string, productId: string) {
  if (!isValidObjectId(productId)) throw new Error("Invalid product ID");
  await connectDB();
  const product = await Product.findById(productId).select("_id").lean<any>();
  if (!product) throw new Error("Product not found");

  const existing = await WishlistItem.findOne({ userId, productId })
    .select("_id")
    .lean<any>();

  if (existing) {
    await WishlistItem.deleteOne({ _id: existing._id });
    invalidateCache(`wishlist:${userId}`);
    return { wishlisted: false };
  }

  try {
    await WishlistItem.create({ userId, productId });
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
  }
  invalidateCache(`wishlist:${userId}`);
  return { wishlisted: true };
}

export async function clearWishlist(userId: string) {
  await connectDB();
  await WishlistItem.deleteMany({ userId });
  invalidateCache(`wishlist:${userId}`);
  return { success: true };
}
