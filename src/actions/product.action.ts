"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { Product } from "@/models";
import { generateUniqueSlug } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import { productSchema } from "@/lib/validators";

export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  categoryId: string;
  stock: number;
  sku?: string;
}) {
  try {
    const session = await auth();

    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role;
    if (!userId) throw new Error("Unauthorized: No session found. Please log in again.");
    if (userRole !== "SELLER" && userRole !== "ADMIN") {
      throw new Error("Forbidden: Only sellers and admins can create products.");
    }

    const validated = productSchema.parse(data);

    await connectDB();
    const slug = await generateUniqueSlug(validated.name, async (s) => {
      const existing = await Product.findOne({ slug: s }).select("_id").lean();
      return !!existing;
    });
    const product = await Product.create({
      ...validated,
      slug,
      sellerId: userId,
    });
    revalidateTag("products");
    return {
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
    };
  } catch (error: any) {
    console.error("Error creating product:", error);
    throw new Error(error.message || "Failed to create product");
  }
}

export async function updateProduct({
  data,
  slug,
}: {
  data: Record<string, any>;
  slug: string;
}) {
  try {
    const session = await auth();

    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role;
    if (!userId) throw new Error("Unauthorized");

    const validated = productSchema.partial().parse(data);

    await connectDB();

    const filter: Record<string, unknown> = { slug };
    if (userRole !== "ADMIN") {
      filter.sellerId = userId;
    }

    const existingProduct = await Product.findOne(filter).select("_id name slug").lean() as any;
    if (!existingProduct) throw new Error("Product not found or unauthorized");

    const updateData: Record<string, any> = { ...validated };
    delete updateData.sellerId;
    delete updateData._id;

    if (validated.name && validated.name !== existingProduct.name) {
      updateData.slug = await generateUniqueSlug(validated.name, async (s) => {
        const conflict = await Product.findOne({ slug: s, _id: { $ne: existingProduct._id } }).select("_id").lean();
        return !!conflict;
      });
    }

    const product = await Product.findOneAndUpdate(filter, updateData, { new: true }).lean() as any;
    if (!product) throw new Error("Product not found or unauthorized");
    revalidateTag("products");
    return {
      id: product?._id?.toString(),
      name: product?.name,
      slug: product?.slug,
    };
  } catch (error: any) {
    console.error("Error updating product:", error);
    throw new Error(error.message || "Failed to update product");
  }
}

export async function deleteProduct(id: string) {
  try {
    const session = await auth();

    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role;
    if (!userId) throw new Error("Unauthorized");

    await connectDB();
    const filter: Record<string, unknown> = { _id: id };
    if (userRole !== "ADMIN") filter.sellerId = userId;
    const result = await Product.deleteOne(filter);
    if (result.deletedCount === 0) {
      throw new Error("Product not found or unauthorized");
    }

    // Cascade cleanup: remove related cart items, wishlist items, and reviews
    const { CartItem, WishlistItem, Review } = await import("@/models");
    await Promise.all([
      CartItem.deleteMany({ productId: id }).catch(() => {}),
      WishlistItem.deleteMany({ productId: id }).catch(() => {}),
      Review.deleteMany({ productId: id }).catch(() => {}),
    ]);

    revalidateTag("products");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    throw new Error(error.message || "Failed to delete product");
  }
}
