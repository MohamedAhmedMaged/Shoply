import connectDB from "@/lib/db";
import { Order, User, OrderStatusHistory, OrderItem } from "@/models";
import { OrderStatus, PaymentStatus } from "@/types";
import { sendOrderStatusUpdate } from "@/lib/email";
import { PaginatedResult, OrderWithItems } from "@/types";
import { PAGINATION } from "@/lib/config";

async function addStatusHistoryEntry(
  orderId: string,
  fromStatus: string | null,
  toStatus: string,
  changedBy?: string,
  note?: string,
) {
  try {
    await OrderStatusHistory.create({
      orderId,
      fromStatus,
      toStatus,
      changedBy,
      note,
    });
  } catch (err) {
    console.error("Failed to record order status history:", err);
  }
}

// Valid order status transitions
const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

// Valid payment status transitions
const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ["COMPLETED", "FAILED"],
  COMPLETED: ["REFUNDED"],
  FAILED: ["PENDING"],
  REFUNDED: [],
};

export async function getOrderById(orderId: string) {
  await connectDB();
  const order = await Order.findById(orderId).lean();
  if (!order) throw new Error("Order not found");
  const items = await OrderItem.find({ orderId: (order as any)._id }).lean();
  return serializeOrder({ ...(order as any), items });
}

export async function getOrderByNumber(orderNumber: string) {
  await connectDB();
  const order = await Order.findOne({ orderNumber }).lean();
  if (!order) throw new Error("Order not found");
  const items = await OrderItem.find({ orderId: (order as any)._id }).lean();
  return serializeOrder({ ...(order as any), items });
}

export async function getUserOrders(
  userId: string,
  page = 1,
  limit: number = PAGINATION.DEFAULT_LIMIT,
) {
  await connectDB();
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.aggregate([
      { $match: { userId: new (await import("mongoose")).Types.ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "orderId",
          as: "items",
        },
      },
    ]),
    Order.countDocuments({ userId }),
  ]);

  const ordersWithItems = orders.map((o: any) => serializeOrder(o));

  return {
    data: ordersWithItems,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  } as PaginatedResult<OrderWithItems>;
}

export async function getAllOrders(page = 1, limit: number = PAGINATION.DEFAULT_LIMIT) {
  await connectDB();
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.aggregate([
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "orderId",
          as: "items",
        },
      },
    ]),
    Order.countDocuments(),
  ]);

  const ordersWithItems = orders.map((o: any) => serializeOrder(o));

  return {
    data: ordersWithItems,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  } as PaginatedResult<OrderWithItems>;
}

function serializeOrder(order: any) {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    userId: order.userId?.toString() || null,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    discountAmount: order.discountAmount || 0,
    total: order.total,
    couponCode: order.couponCode || null,
    shippingAddress: order.shippingAddress,
    stripeSessionId: order.stripeSessionId || null,
    items: (order.items || []).map((item: any) => ({
      id: item._id.toString(),
      orderId: item.orderId?.toString() || item.orderId,
      productId: item.productId?.toString() || item.productId,
      variantId: item.variantId?.toString() || null,
      variantName: item.variantName || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    })),
    createdAt: order.createdAt?.toString() || null,
    updatedAt: order.updatedAt?.toString() || null,
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, changedBy?: string) {
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const currentStatus = order.status as OrderStatus;
  const validNextStatuses = ORDER_STATUS_TRANSITIONS[currentStatus];
  if (!validNextStatuses || !validNextStatuses.includes(status)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${status}. Valid transitions: ${validNextStatuses?.join(", ") || "none"}`,
    );
  }

  order.status = status;
  await order.save();

  await addStatusHistoryEntry(orderId, currentStatus, status, changedBy);

  const user = order.userId ? await User.findById(order.userId) : null;
  const email = user?.email;
  if (email) {
    await sendOrderStatusUpdate(email, order.orderNumber, status).catch(
      () => {},
    );
  }

  return order;
}

export async function cancelOrder(orderId: string, userId: string) {
  await connectDB();
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new Error("Order not found");

  const currentStatus = order.status as OrderStatus;
  if (!ORDER_STATUS_TRANSITIONS[currentStatus]?.includes("CANCELLED")) {
    throw new Error(
      `Order in status "${currentStatus}" cannot be cancelled. Only PENDING, CONFIRMED, or PROCESSING orders can be cancelled.`,
    );
  }

  order.status = "CANCELLED";
  if (order.paymentMethod === "STRIPE" && order.paymentStatus === "COMPLETED" && order.stripePaymentId) {
    try {
      const { stripe } = await import("@/lib/stripe");
      await stripe.refunds.create({
        payment_intent: order.stripePaymentId,
      });
      order.paymentStatus = "REFUNDED";
    } catch (err) {
      console.error("Failed to process Stripe refund on order cancellation:", err);
      order.paymentStatus = "FAILED";
    }
  } else if (order.paymentStatus === "COMPLETED") {
    order.paymentStatus = "REFUNDED";
  } else {
    order.paymentStatus = currentStatus === "PENDING" ? "PENDING" : "FAILED";
  }
  await order.save();

  await addStatusHistoryEntry(orderId, currentStatus, "CANCELLED", userId, "Cancelled by user");

  // Restore stock for cancelled order
  const items = await OrderItem.find({ orderId: order._id }).lean();
  const { restoreStock } = await import("@/features/inventory/inventory.service");
  const requirements = items.map((item: any) => ({
    productId: item.productId.toString(),
    quantity: item.quantity,
  }));
  await restoreStock(requirements).catch(() => {});

  return { success: true };
}

export async function refundOrder(orderId: string) {
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (order.status !== "DELIVERED") {
    throw new Error("Only delivered orders can be refunded");
  }

  const currentPaymentStatus = order.paymentStatus as PaymentStatus;
  if (!PAYMENT_STATUS_TRANSITIONS[currentPaymentStatus]?.includes("REFUNDED")) {
    throw new Error(`Payment in status "${currentPaymentStatus}" cannot be refunded`);
  }

  // If Stripe payment, process refund
  if (order.paymentMethod === "STRIPE" && order.stripePaymentId) {
    try {
      const { stripe } = await import("@/lib/stripe");
      await stripe.refunds.create({
        payment_intent: order.stripePaymentId,
      });
    } catch (err: any) {
      throw new Error(`Stripe refund failed: ${err.message}`);
    }
  }

  const previousStatus = order.status;
  order.status = "REFUNDED";
  order.paymentStatus = "REFUNDED";
  await order.save();

  await addStatusHistoryEntry(orderId, previousStatus, "REFUNDED", "admin", "Refund processed");

  // Restore stock
  const items = await OrderItem.find({ orderId: order._id }).lean();
  const { restoreStock } = await import("@/features/inventory/inventory.service");
  const requirements = items.map((item: any) => ({
    productId: item.productId.toString(),
    quantity: item.quantity,
  }));
  await restoreStock(requirements).catch(() => {});

  return { success: true };
}

export async function getSellerOrders(
  sellerId: string,
  page = 1,
  limit: number = PAGINATION.DEFAULT_LIMIT,
) {
  await connectDB();
  const skip = (page - 1) * limit;

  const sellerProductIds = await getSellerProductIds(sellerId);

  const [orders, total] = await Promise.all([
    Order.aggregate([
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "orderId",
          as: "items",
        },
      },
      { $unwind: "$items" },
      { $match: { "items.productId": { $in: sellerProductIds } } },
      {
        $group: {
          _id: "$_id",
          doc: { $first: "$$ROOT" },
          items: { $push: "$items" },
        },
      },
      { $replaceRoot: { newRoot: { $mergeObjects: ["$doc", { items: "$items" }] } } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]),
    OrderItem.countDocuments({ productId: { $in: sellerProductIds } }),
  ]);

  const ordersWithItems = orders.map((o: any) => ({
    ...o,
    id: o._id.toString(),
    items: o.items || [],
  }));

  return {
    data: ordersWithItems,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getSellerProductIds(sellerId: string) {
  const { Product } = await import("@/models");
  const products = await Product.find({ sellerId }).select("_id").lean();
  return products.map((p: any) => p._id);
}
