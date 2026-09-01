"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { Category, Product } from "@/models";
import { generateSlug } from "@/lib/utils";
import { revalidateTag } from "next/cache";

export async function createCategory(data: {
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
      throw new Error("Unauthorized");

    await connectDB();
    const slug = generateSlug(data.name);
    const category = await Category.create({ ...data, slug });
    revalidateTag("categories");
    return {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
    };
  } catch (error: any) {
    console.error("Error creating category:", error);
    throw new Error(error.message || "Failed to create category");
  }
}

export async function updateCategory({
  data,
  id,
}: {
  data: Record<string, any>;
  id: string;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
      throw new Error("Unauthorized");

    await connectDB();
    if (data.name) data.slug = generateSlug(data.name);
    const category = await Category.findByIdAndUpdate(id, data, { new: true }).lean() as any;
    revalidateTag("categories");
    return {
      id: category?._id?.toString(),
      name: category?.name,
      slug: category?.slug,
    };
  } catch (error: any) {
    console.error("Error updating category:", error);
    throw new Error(error.message || "Failed to update category");
  }
}

export async function deleteCategory(id: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
      throw new Error("Unauthorized");

    await connectDB();
    const productCount = await Product.countDocuments({ categoryId: id });
    if (productCount > 0) throw new Error("Cannot delete category with products");

    await Category.deleteOne({ _id: id });
    revalidateTag("categories");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    throw new Error(error.message || "Failed to delete category");
  }
}
