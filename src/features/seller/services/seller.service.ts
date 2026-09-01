import connectDB from "@/lib/db";
import { Product, OrderItem } from "@/models";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/features/products/services/product.service";
import { getSellerOrders } from "@/features/orders/services/order.service";

export async function getSellerProducts(
  sellerId: string,
  page = 1,
  limit = 20,
) {
  await connectDB();
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find({ sellerId })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments({ sellerId }),
  ]);
  return {
    data: products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getSellerDashboard(sellerId: string) {
  await connectDB();
  const [totalProducts, sellerProducts] = await Promise.all([
    Product.countDocuments({ sellerId }),
    Product.find({ sellerId }).select("_id").lean(),
  ]);

  const sellerProductIds = sellerProducts.map((p: any) => p._id);

  if (sellerProductIds.length === 0) {
    return {
      totalProducts,
      totalOrders: 0,
      totalRevenue: 0,
    };
  }

  const stats = await OrderItem.aggregate([
    { $match: { productId: { $in: sellerProductIds } } },
    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },
    { $unwind: "$order" },
    { $match: { "order.status": { $nin: ["CANCELLED", "REFUNDED"] } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
        distinctOrders: { $addToSet: "$orderId" },
      },
    },
  ]);

  return {
    totalProducts,
    totalOrders: stats[0]?.distinctOrders?.length || 0,
    totalRevenue: stats[0]?.totalRevenue || 0,
  };
}

export async function updateStock(
  productId: string,
  sellerId: string,
  stock: number,
) {
  await connectDB();
  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product) throw new Error("Product not found or unauthorized");
  product.stock = stock;
  await product.save();
  return product;
}

export { createProduct, updateProduct, deleteProduct, getSellerOrders };
