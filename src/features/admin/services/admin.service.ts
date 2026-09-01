import connectDB from "@/lib/db";
import { User, Product, Order, Banner, Category } from "@/models";
import { OrderStatus, Role } from "@/types";
import {
  BannerInput,
  CategoryInput,
} from "@/lib/validators";
import { generateSlug } from "@/lib/utils";
import { DashboardStats } from "@/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();
  const [totalUsers, totalProducts, totalOrders, revenueResult] =
    await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: "COMPLETED" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue: revenueResult[0]?.total || 0,
    recentOrders: recentOrders as any,
  };
}

export async function adminGetAllUsers(page = 1, limit = 20) {
  await connectDB();
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.aggregate([
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "userOrders",
        },
      },
      {
        $addFields: {
          orderCount: { $size: "$userOrders" },
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          orderCount: 1,
        },
      },
    ]),
    User.countDocuments(),
  ]);

  const usersWithOrderCount = users.map((u: any) => ({
    ...u,
    id: u._id.toString(),
    _count: { orders: u.orderCount },
  }));

  return {
    data: usersWithOrderCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function adminUpdateUserRole(userId: string, role: Role) {
  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true },
  ).select("id name email role");
  if (!user) throw new Error("User not found");
  return user;
}

export async function adminDeleteUser(userId: string) {
  await connectDB();
  await User.deleteOne({ _id: userId });
  return { success: true };
}

export async function adminGetAllProducts(page = 1, limit = 20) {
  await connectDB();
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find()
      .populate("categoryId", "name")
      .populate("sellerId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(),
  ]);
  return {
    data: products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function adminUpdateProduct(
  productId: string,
  data: { isActive?: boolean },
) {
  await connectDB();
  const product = await Product.findByIdAndUpdate(productId, data, {
    new: true,
  });
  if (!product) throw new Error("Product not found");
  return product;
}

export async function adminGetAllOrders(page = 1, limit = 20) {
  await connectDB();
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(),
  ]);
  return {
    data: orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function adminUpdateOrderStatus(
  orderId: string,
  status: OrderStatus,
) {
  const { updateOrderStatus } =
    await import("@/features/orders/services/order.service");
  return updateOrderStatus(orderId, status);
}

export async function getBanners() {
  await connectDB();
  return Banner.find({ isActive: true }).sort({ order: 1 }).lean();
}

export async function getAllBanners() {
  await connectDB();
  return Banner.find().sort({ order: 1 }).lean();
}

export async function createBanner(input: BannerInput) {
  await connectDB();
  return Banner.create(input);
}

export async function updateBanner(id: string, input: Partial<BannerInput>) {
  await connectDB();
  const banner = await Banner.findByIdAndUpdate(id, input, { new: true });
  if (!banner) throw new Error("Banner not found");
  return banner;
}

export async function deleteBanner(id: string) {
  await connectDB();
  await Banner.deleteOne({ _id: id });
  return { success: true };
}

export async function createCategoryAdmin(input: CategoryInput) {
  await connectDB();
  const slug = generateSlug(input.name);
  const category = await Category.create({ ...input, slug });
  return category;
}
