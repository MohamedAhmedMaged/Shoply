import connectDB from "@/lib/db";
import { Product, Category, Review } from "@/models";
import { ProductInput } from "@/lib/validators";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";
import { PaginatedResult, ProductWithCategory } from "@/types";
import { PAGINATION } from "@/lib/config";

interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: "price" | "createdAt" | "name" | "discount";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  deals?: boolean;
}

export async function getProducts(
  filters: ProductFilters,
): Promise<PaginatedResult<ProductWithCategory>> {
  await connectDB();
  const page = filters.page || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    filters.limit || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { isActive: true };

  if (filters.category) {
    const cat = await Category.findOne({ slug: filters.category }).select(
      "_id",
    );
    if (cat) query.categoryId = cat._id;
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const min = filters.minPrice;
    const max = filters.maxPrice;
    if (min !== undefined && max !== undefined && min > max) {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    query.price = {};
    if (min !== undefined && min >= 0)
      (query.price as Record<string, unknown>).$gte = min;
    if (max !== undefined && max >= 0)
      (query.price as Record<string, unknown>).$lte = max;
  }
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  if (filters.deals) {
    query.comparePrice = { $exists: true, $ne: null };
    query.$expr = { $gt: ["$comparePrice", "$price"] };
  }

  const sortField = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
  const sort: Record<string, number> = {};
  sort[sortField] = sortOrder;

  const useDiscountSort = filters.sortBy === "discount";

  const basePipeline = (extra: Record<string, unknown>[] = []) => [
    { $match: query },
    { $addFields: { discountAmount: { $subtract: ["$comparePrice", "$price"] } } },
    ...extra,
    { $sort: useDiscountSort ? { discountAmount: -1, createdAt: -1 } : sort as any },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryId",
      },
    },
    { $unwind: { path: "$categoryId", preserveNullAndEmptyArrays: true } },
  ];

  const [products, total] = await Promise.all([
    useDiscountSort
      ? Product.aggregate(basePipeline() as any[])
      : Product.find(query)
          .populate("categoryId", "id name slug")
          .sort(sort as any)
          .skip(skip)
          .limit(limit)
          .lean(),
    Product.countDocuments(query),
  ]);

  const data = products.map((p: any) => ({
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    comparePrice: p.comparePrice || null,
    images: p.images || [],
    stock: p.stock,
    sku: p.sku || null,
    isActive: p.isActive,
    categoryId: p.categoryId?._id?.toString() || p.categoryId?.toString() || null,
    sellerId: p.sellerId?.toString() || null,
    category: p.categoryId ? {
      id: p.categoryId._id?.toString() || p.categoryId,
      name: p.categoryId.name,
      slug: p.categoryId.slug,
    } : { id: "", name: "", slug: "" },
    avgRating: 0,
    createdAt: p.createdAt?.toString() || null,
    updatedAt: p.updatedAt?.toString() || null,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductById(productId: string) {
  await connectDB();
  const product = await Product.findById(productId)
    .populate("categoryId", "id name slug")
    .populate("sellerId", "id name")
    .lean();
  if (!product) throw new Error("Product not found");

  const p = product as any;
  return {
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    comparePrice: p.comparePrice || null,
    images: p.images || [],
    stock: p.stock,
    sku: p.sku || null,
    isActive: p.isActive,
    category: p.categoryId
      ? {
          id: p.categoryId._id?.toString() || p.categoryId,
          name: p.categoryId.name,
          slug: p.categoryId.slug,
        }
      : null,
    seller: p.sellerId
      ? {
          id: p.sellerId._id?.toString() || p.sellerId,
          name: p.sellerId.name,
        }
      : null,
    createdAt: p.createdAt?.toString() || null,
    updatedAt: p.updatedAt?.toString() || null,
  };
}

export async function getProductBySlug(slug: string) {
  await connectDB();
  const product = await Product.findOne({ slug })
    .populate("categoryId", "id name slug")
    .populate("sellerId", "id name")
    .lean();
  if (!product) throw new Error("Product not found");

  const p = product as any;
  const REVIEW_LIMIT = 10;
  const [reviews, reviewStats] = await Promise.all([
    Review.find({ productId: p._id })
      .populate("userId", "id name avatar")
      .sort({ createdAt: -1 })
      .limit(REVIEW_LIMIT)
      .lean(),
    Review.aggregate([
      { $match: { productId: p._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]),
  ]);
  const stats = reviewStats[0] || { avgRating: 0, totalReviews: 0 };

  return {
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    comparePrice: p.comparePrice || null,
    images: p.images || [],
    stock: p.stock,
    sku: p.sku || null,
    isActive: p.isActive,
    category: p.categoryId ? {
      id: p.categoryId._id?.toString() || p.categoryId,
      name: p.categoryId.name,
      slug: p.categoryId.slug,
    } : null,
    seller: p.sellerId ? {
      id: p.sellerId._id?.toString() || p.sellerId,
      name: p.sellerId.name,
    } : null,
    reviews: (reviews || []).map((r: any) => ({
      id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      userId: r.userId ? {
        id: r.userId._id?.toString() || r.userId,
        name: r.userId.name,
        avatar: r.userId.avatar,
      } : null,
      createdAt: r.createdAt?.toString() || null,
    })),
    avgRating: Math.round((stats.avgRating || 0) * 10) / 10,
    totalReviews: stats.totalReviews || 0,
    hasMoreReviews: (stats.totalReviews || 0) > REVIEW_LIMIT,
    createdAt: p.createdAt?.toString() || null,
    updatedAt: p.updatedAt?.toString() || null,
  };
}

export async function createProduct(sellerId: string, input: ProductInput) {
  await connectDB();
  const slug = await generateUniqueSlug(input.name, async (s) => {
    const existing = await Product.findOne({ slug: s }).select("_id").lean();
    return !!existing;
  });
  const product = await Product.create({ ...input, slug, sellerId });
  return product;
}

export async function updateProduct(
  productId: string,
  sellerId: string,
  input: Partial<ProductInput>,
) {
  await connectDB();
  const existing = await Product.findOne({ _id: productId, sellerId });
  if (!existing) throw new Error("Product not found or unauthorized");

  const data = { ...input } as Record<string, unknown>;
  if (input.name) {
    data.slug = await generateUniqueSlug(input.name, async (s) => {
      const existing = await Product.findOne({ slug: s, _id: { $ne: productId } }).select("_id").lean();
      return !!existing;
    });
  }

  const product = await Product.findByIdAndUpdate(productId, data, {
    new: true,
    runValidators: true,
  });
  return product;
}

export async function deleteProduct(productId: string, sellerId: string) {
  await connectDB();
  const existing = await Product.findOne({ _id: productId, sellerId });
  if (!existing) throw new Error("Product not found or unauthorized");

  await Product.deleteOne({ _id: productId });

  // Cascade cleanup
  const { CartItem, WishlistItem, Review } = await import("@/models");
  await Promise.all([
    CartItem.deleteMany({ productId: productId }).catch(() => {}),
    WishlistItem.deleteMany({ productId: productId }).catch(() => {}),
    Review.deleteMany({ productId: productId }).catch(() => {}),
  ]);

  return { success: true };
}

export async function getCategories() {
  await connectDB();

  // Fetch categories and product counts in parallel without materializing full product docs
  const [categories, countResults] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(
    countResults.map((r: any) => [r._id?.toString(), r.count as number]),
  );

  return categories.map((cat: any) => ({
    id: cat._id.toString(),
    name: cat.name,
    slug: cat.slug,
    description: cat.description || null,
    image: cat.image || null,
    parentId: cat.parentId?.toString() || null,
    _count: { products: countMap.get(cat._id.toString()) || 0 },
    createdAt: cat.createdAt?.toString() || null,
    updatedAt: cat.updatedAt?.toString() || null,
  }));
}

export async function createCategory(input: {
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
}) {
  await connectDB();
  const slug = generateSlug(input.name);
  const category = await Category.create({ ...input, slug });
  return category;
}
