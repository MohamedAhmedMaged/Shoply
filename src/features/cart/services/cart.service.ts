import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Cart, CartItem, Product, Order } from "@/models";
import { CartItemInput, CheckoutInput } from "@/lib/validators";
import { generateOrderNumber } from "@/lib/utils";
import { createCheckoutSession } from "@/lib/stripe";
import { sendOrderConfirmation } from "@/lib/email";
import {
  decrementStock,
  validateStock,
  restoreStock,
} from "@/features/inventory/inventory.service";
import { validateCoupon, trackCouponUsage } from "@/features/coupons/services/coupon.service";
import { CHECKOUT } from "@/lib/config";
import { getCache, setCache, invalidateCache } from "@/lib/cache";

export class CartAuthError extends Error {
  constructor(message = "Authentication required for cart operation") {
    super(message);
    this.name = "CartAuthError";
  }
}

export async function getOrCreateCart(userId?: string, guestId?: string) {
  await connectDB();

  if (userId) {
    const cacheKey = `cart:${userId}`;
    const cached = getCache<any>(cacheKey);
    if (cached) return cached;

    let cart = await Cart.findOne({ userId }).populate({
      path: "items",
      populate: { path: "productId" },
    }).lean() as any;
    if (!cart) {
      const newCart = await Cart.create({ userId });
      return serializeCart({ _id: newCart._id, userId: newCart.userId, items: [], createdAt: newCart.createdAt, updatedAt: newCart.updatedAt });
    }
    const serialized = serializeCart(cart);
    setCache(cacheKey, serialized, 15_000);
    return serialized;
  }

  if (guestId) {
    let cart = await Cart.findOne({ guestId }).populate({
      path: "items",
      populate: { path: "productId" },
    }).lean() as any;
    if (!cart) {
      const newCart = await Cart.create({ guestId });
      return serializeCart({ _id: newCart._id, guestId: newCart.guestId, items: [], createdAt: newCart.createdAt, updatedAt: newCart.updatedAt });
    }
    return serializeCart(cart);
  }

  throw new CartAuthError();
}

function serializeCart(cart: any) {
  return {
    id: cart._id.toString(),
    userId: cart.userId?.toString() || null,
    guestId: cart.guestId || null,
    items: (cart.items || [])
      .filter((item: any) => item != null && (item._id != null || item.id != null))
      .map((item: any) => ({
        id: (item._id || item.id).toString(),
        cartId: item.cartId?.toString() || item.cartId,
        productId: item.productId ? {
          id: item.productId._id?.toString() || item.productId.id || item.productId,
          name: item.productId.name,
          slug: item.productId.slug,
          price: item.productId.price,
          comparePrice: item.productId.comparePrice || null,
          images: item.productId.images || [],
          stock: item.productId.stock,
        } : null,
        variantId: item.variantId?.toString() || null,
        quantity: item.quantity,
      })),
    createdAt: cart.createdAt?.toString() || null,
    updatedAt: cart.updatedAt?.toString() || null,
  };
}

export async function addToCart(
  input: CartItemInput,
  userId?: string,
  guestId?: string,
) {
  if (!userId && !guestId) throw new CartAuthError();

  await connectDB();

  let cartDoc = await Cart.findOne(userId ? { userId } : { guestId });
  if (!cartDoc) {
    cartDoc = await Cart.create(userId ? { userId } : { guestId });
  }

  const product = await Product.findById(input.productId);
  if (!product) throw new Error("Product not found");
  if (input.quantity < 1) throw new Error("Quantity must be at least 1");
  if (!product.isActive) throw new Error("Product is not available");
  if (userId && product.sellerId?.toString() === userId) {
    throw new Error("You cannot add your own products to the cart");
  }

  // Check variant stock if variantId provided
  let variant;
  if (input.variantId) {
    const { default: ProductVariant } = await import("@/models/ProductVariant");
    variant = await ProductVariant.findById(input.variantId);
    if (!variant) throw new Error("Variant not found");
    if (!variant.isActive) throw new Error("Variant is not available");
  }

  const existingItem = await CartItem.findOne({
    cartId: cartDoc._id,
    productId: input.productId,
    variantId: input.variantId || { $exists: false },
  });
  const targetQuantity = existingItem
    ? existingItem.quantity + input.quantity
    : input.quantity;

  const availableStock = variant ? variant.stock : product.stock;
  if (availableStock < targetQuantity) {
    throw new Error(
      `Only ${availableStock} unit${availableStock === 1 ? "" : "s"} available in stock`,
    );
  }

  if (existingItem) {
    existingItem.quantity = targetQuantity;
    await existingItem.save();
  } else {
    const newItem = await CartItem.create({
      cartId: cartDoc._id,
      productId: input.productId,
      variantId: input.variantId || undefined,
      quantity: input.quantity,
    });
    cartDoc.items.push(newItem._id);
    await cartDoc.save();
  }

  // Directly populate the cart we already have instead of re-finding by userId/guestId
  const updatedCart = await Cart.findById(cartDoc._id).populate({
    path: "items",
    populate: { path: "productId" },
  }).lean() as any;
  if (userId) invalidateCache(`cart:${userId}`);
  await Cart.findByIdAndUpdate(cartDoc._id, { lastActiveAt: new Date() });
  return serializeCart(updatedCart);
}

export async function updateCartItem(cartItemId: string, quantity: number) {
  await connectDB();
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Quantity must be a non-negative integer");
  }
  if (quantity <= 0) {
    const cartItem = await CartItem.findById(cartItemId);
    if (cartItem) {
      await Cart.updateOne(
        { _id: cartItem.cartId },
        { $pull: { items: cartItem._id } },
      );
      const cart = await Cart.findById(cartItem.cartId).select("userId").lean<any>();
      if (cart?.userId) invalidateCache(`cart:${cart.userId}`);
    }
    await CartItem.deleteOne({ _id: cartItemId });
    return;
  }
  const cartItem = await CartItem.findById(cartItemId);
  if (!cartItem) throw new Error("Cart item not found");
  const product = await Product.findById(cartItem.productId);
  if (!product) throw new Error("Product not found");
  if (!product.isActive) throw new Error("Product is not available");
  if (quantity > product.stock) {
    throw new Error(
      `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available in stock`,
    );
  }
  await CartItem.findByIdAndUpdate(cartItemId, { quantity });
  const cart = await Cart.findById(cartItem.cartId).select("userId").lean<any>();
  if (cart?.userId) invalidateCache(`cart:${cart.userId}`);
  await Cart.findByIdAndUpdate(cartItem.cartId, { lastActiveAt: new Date() });
}

export async function removeCartItem(cartItemId: string) {
  await connectDB();
  const cartItem = await CartItem.findById(cartItemId);
  if (cartItem) {
    await Cart.updateOne(
      { _id: cartItem.cartId },
      { $pull: { items: cartItem._id } }
    );
    const cart = await Cart.findById(cartItem.cartId).select("userId").lean<any>();
    if (cart?.userId) invalidateCache(`cart:${cart.userId}`);
    await Cart.findByIdAndUpdate(cartItem.cartId, { lastActiveAt: new Date() });
  }
  await CartItem.deleteOne({ _id: cartItemId });
}

export async function clearCart(cartId: string, session?: mongoose.ClientSession) {
  await connectDB();
  const opts = session ? { session } : {};
  await CartItem.deleteMany({ cartId }, opts);
  const cart = await Cart.findByIdAndUpdate(cartId, { items: [] }, { ...opts, new: true });
  if (cart?.userId) invalidateCache(`cart:${cart.userId}`);
}

export async function checkout(input: CheckoutInput, userId: string, idempotencyKey?: string) {
  if (!userId) throw new CartAuthError("Checkout requires an authenticated user");

  await connectDB();

  if (idempotencyKey) {
    const { default: IdempotencyKey } = await import("@/models/IdempotencyKey");
    const existing = await IdempotencyKey.findOne({ key: idempotencyKey });
    if (existing) {
      return JSON.parse(existing.response);
    }
  }

  const { OrderItem } = await import("@/models");

  const cartDoc = await Cart.findOne({ userId });
  if (!cartDoc) throw new Error("Cart not found");

  const cartItems = await CartItem.find({ cartId: cartDoc._id }).populate(
    "productId",
  );
  if (cartItems.length === 0) throw new Error("Cart is empty");

  const requirements = cartItems.map((item: any) => ({
    productId: item.productId._id.toString(),
    quantity: item.quantity,
  }));

  await validateStock(requirements);

  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + item.productId.price * item.quantity,
    0,
  );

  let couponCode: string | undefined;
  let discountAmount = 0;
  if (input.couponCode) {
    const couponResult = await validateCoupon(input.couponCode, userId, subtotal);
    if (!couponResult.valid || !couponResult.coupon) {
      throw new Error(couponResult.error || "Invalid coupon");
    }
    couponCode = input.couponCode;
    discountAmount = couponResult.coupon.discount;
  }

  const shippingCost = subtotal >= CHECKOUT.FREE_SHIPPING_THRESHOLD ? 0 : CHECKOUT.SHIPPING_COST;
  const tax = Math.round(subtotal * CHECKOUT.TAX_RATE * 100) / 100;
  const total = Math.max(0, Math.round((subtotal + shippingCost + tax - discountAmount) * 100) / 100);

  const orderNumber = generateOrderNumber();

  const session = await mongoose.startSession();
  try {
    let orderResult: { orderId: string; orderNumber: string };

    await session.withTransaction(async () => {
      await decrementStock(requirements, session);

      const order = await Order.create([{
        orderNumber,
        userId,
        paymentMethod: input.paymentMethod,
        subtotal,
        shippingCost,
        tax,
        total,
        discountAmount,
        couponCode,
        shippingAddress: input.shippingAddress,
      }], { session }).then(docs => docs[0]);

      if (couponCode && discountAmount > 0) {
        const couponDoc = await (await import("@/models")).Coupon.findOne({ code: couponCode.toUpperCase() }).session(session);
        if (couponDoc) {
          await trackCouponUsage(couponDoc._id.toString(), userId, order._id.toString(), session);
        }
      }

      const variantIds = cartItems
        .filter((item: any) => item.variantId)
        .map((item: any) => item.variantId);
      const { default: ProductVariant } = await import("@/models/ProductVariant");
      const variants = variantIds.length > 0
        ? await ProductVariant.find({ _id: { $in: variantIds } }).select("name").lean()
        : [];
      const variantNameMap = new Map(variants.map((v: any) => [v._id.toString(), v.name]));

      const orderItemDocs = cartItems.map((item: any) => ({
        orderId: order._id,
        productId: item.productId._id,
        variantId: item.variantId || undefined,
        variantName: item.variantId ? variantNameMap.get(item.variantId.toString()) : undefined,
        name: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity,
        image: item.productId.images[0] || "",
      }));
      await OrderItem.insertMany(orderItemDocs, { session });

      if (input.paymentMethod === "COD") {
        order.status = "CONFIRMED";
        order.paymentStatus = "PENDING";
        await order.save({ session });
      }

      await clearCart(cartDoc._id.toString(), session);

      orderResult = { orderId: order._id.toString(), orderNumber };
    });

    session.endSession();

    if (input.paymentMethod === "STRIPE") {
      const stripeSession = await createCheckoutSession(orderResult!.orderId, total);
      await Order.findByIdAndUpdate(orderResult!.orderId, { stripeSessionId: stripeSession.id });

      const stripeResponse = {
        orderId: orderResult!.orderId,
        orderNumber,
        stripeUrl: stripeSession.url,
      };

      if (idempotencyKey) {
        const { default: IdempotencyKey } = await import("@/models/IdempotencyKey");
        await IdempotencyKey.create({
          key: idempotencyKey,
          response: JSON.stringify(stripeResponse),
          statusCode: 200,
        }).catch(() => {});
      }

      return stripeResponse;
    }

    await sendOrderConfirmation(input.email, orderNumber, total).catch(() => {});

    const codResponse = { orderId: orderResult!.orderId, orderNumber };

    if (idempotencyKey) {
      const { default: IdempotencyKey } = await import("@/models/IdempotencyKey");
      await IdempotencyKey.create({
        key: idempotencyKey,
        response: JSON.stringify(codResponse),
        statusCode: 200,
      }).catch(() => {});
    }

    return codResponse;
  } catch (err: any) {
    session.endSession();

    const isTxnNotSupported =
      err?.message?.includes('replica set') ||
      err?.message?.includes('Transaction') ||
      err?.message?.includes('transaction') ||
      err?.code === 48 ||
      err?.code === 263;

    if (!isTxnNotSupported) throw err;
  }

  // Non-transactional fallback for standalone MongoDB
  await decrementStock(requirements);

  try {
    const order = await Order.create({
      orderNumber,
      userId,
      paymentMethod: input.paymentMethod,
      subtotal,
      shippingCost,
      tax,
      total,
      discountAmount,
      couponCode,
      shippingAddress: input.shippingAddress,
    });

    if (couponCode && discountAmount > 0) {
      const couponDoc = await (await import("@/models")).Coupon.findOne({ code: couponCode.toUpperCase() });
      if (couponDoc) {
        await trackCouponUsage(couponDoc._id.toString(), userId, order._id.toString()).catch(() => {});
      }
    }

    const variantIds = cartItems
      .filter((item: any) => item.variantId)
      .map((item: any) => item.variantId);
    const { default: ProductVariant } = await import("@/models/ProductVariant");
    const variants = variantIds.length > 0
      ? await ProductVariant.find({ _id: { $in: variantIds } }).select("name").lean()
      : [];
    const variantNameMap = new Map(variants.map((v: any) => [v._id.toString(), v.name]));

    const orderItemDocs = cartItems.map((item: any) => ({
      orderId: order._id,
      productId: item.productId._id,
      variantId: item.variantId || undefined,
      variantName: item.variantId ? variantNameMap.get(item.variantId.toString()) : undefined,
      name: item.productId.name,
      price: item.productId.price,
      quantity: item.quantity,
      image: item.productId.images[0] || "",
    }));
    await OrderItem.insertMany(orderItemDocs);

    if (input.paymentMethod === "STRIPE") {
      const stripeSession = await createCheckoutSession(order._id.toString(), total);
      order.stripeSessionId = stripeSession.id;
      await order.save();

      const stripeResult = {
        orderId: order._id.toString(),
        orderNumber,
        stripeUrl: stripeSession.url,
      };

      if (idempotencyKey) {
        const { default: IdempotencyKey } = await import("@/models/IdempotencyKey");
        await IdempotencyKey.create({
          key: idempotencyKey,
          response: JSON.stringify(stripeResult),
          statusCode: 200,
        }).catch(() => {});
      }

      return stripeResult;
    }

    if (input.paymentMethod === "COD") {
      order.status = "CONFIRMED";
      order.paymentStatus = "PENDING";
      await order.save();
    }

    await clearCart(cartDoc._id.toString());
    await sendOrderConfirmation(input.email, orderNumber, total).catch(() => {});

    const result = { orderId: order._id.toString(), orderNumber };

    if (idempotencyKey) {
      const { default: IdempotencyKey } = await import("@/models/IdempotencyKey");
      await IdempotencyKey.create({
        key: idempotencyKey,
        response: JSON.stringify(result),
        statusCode: 200,
      }).catch(() => {});
    }

    return result;
  } catch (err) {
    await restoreStock(requirements).catch(() => {});
    throw err;
  }
}

export async function mergeGuestCart(guestId: string, userId: string) {
  if (!userId) throw new CartAuthError();
  if (!guestId) return;

  await connectDB();

  const guestCart = await Cart.findOneAndDelete({ guestId });
  if (!guestCart || guestCart.items.length === 0) return;

  const userCartDoc = await Cart.findOne({ userId });
  if (!userCartDoc) {
    await Cart.create({
      _id: guestCart._id,
      userId,
      items: guestCart.items,
    });
    return;
  }

  // Bulk-fetch all guest items and products instead of N+1 lookups
  const guestItems = await CartItem.find({ _id: { $in: guestCart.items } }).lean();
  if (guestItems.length === 0) return;

  const productIds = guestItems.map((item: any) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } })
    .select("stock isActive")
    .lean();
  const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

  // Bulk-fetch existing user cart items for these products
  const existingItems = await CartItem.find({
    cartId: userCartDoc._id,
    productId: { $in: productIds },
  }).lean();
  const existingByProduct = new Map(
    existingItems.map((item: any) => [item.productId.toString(), item]),
  );

  // Build bulkWrite ops
  const ops: any[] = [];
  const newItemIds: any[] = [];
  const idsToDelete: any[] = [];

  for (const item of guestItems) {
    const productIdStr = (item as any).productId.toString();
    const product = productMap.get(productIdStr);

    if (!product || !(product as any).isActive) {
      idsToDelete.push(item._id);
      continue;
    }

    const existing = existingByProduct.get(productIdStr);
    const stock = (product as any).stock;

    if (existing) {
      const summed = existing.quantity + item.quantity;
      ops.push({
        updateOne: {
          filter: { _id: existing._id },
          update: { quantity: Math.min(summed, stock) },
        },
      });
      idsToDelete.push(item._id);
    } else {
      ops.push({
        updateOne: {
          filter: { _id: item._id },
          update: {
            cartId: userCartDoc._id,
            quantity: Math.min(item.quantity, stock),
          },
        },
      });
      newItemIds.push(item._id);
    }
  }

  // Execute all item mutations in a single bulkWrite
  if (ops.length > 0) {
    await CartItem.bulkWrite(ops);
  }

  // Remove orphaned guest items in one call
  if (idsToDelete.length > 0) {
    await CartItem.deleteMany({ _id: { $in: idsToDelete } });
  }

  // Update user cart's items array in one call
  await Cart.findByIdAndUpdate(userCartDoc._id, {
    $addToSet: { items: { $each: newItemIds } },
  });
}
