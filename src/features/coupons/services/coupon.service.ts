import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Coupon, CouponUsage } from "@/models";

export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    discount: number;
  };
  error?: string;
}

export async function validateCoupon(
  code: string,
  userId: string,
  subtotal: number,
): Promise<CouponValidationResult> {
  await connectDB();

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    return { valid: false, error: "Coupon not found" };
  }

  if (!coupon.isActive) {
    return { valid: false, error: "This coupon is no longer active" };
  }

  if (new Date() > new Date(coupon.expiresAt)) {
    return { valid: false, error: "This coupon has expired" };
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} required`,
    };
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: "This coupon has reached its usage limit" };
  }

  // Check per-user usage limit
  if (coupon.perUserLimit > 0) {
    const userUsageCount = await CouponUsage.countDocuments({
      couponId: coupon._id,
      userId,
    });
    if (userUsageCount >= coupon.perUserLimit) {
      return {
        valid: false,
        error: `You have already used this coupon ${coupon.perUserLimit} time(s)`,
      };
    }
  }

  const discount = calculateDiscount(
    coupon.type as "PERCENTAGE" | "FIXED",
    coupon.value,
    subtotal,
    coupon.maxDiscount,
  );

  return {
    valid: true,
    coupon: {
      id: coupon._id.toString(),
      code: coupon.code,
      type: coupon.type as "PERCENTAGE" | "FIXED",
      value: coupon.value,
      discount,
    },
  };
}

export function calculateDiscount(
  type: "PERCENTAGE" | "FIXED",
  value: number,
  subtotal: number,
  maxDiscount?: number,
): number {
  let discount: number;

  if (type === "PERCENTAGE") {
    discount = Math.round(subtotal * (value / 100) * 100) / 100;
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else {
    discount = Math.min(value, subtotal);
  }

  return discount;
}

export async function trackCouponUsage(
  couponId: string,
  userId: string,
  orderId: string,
  session?: mongoose.ClientSession
) {
  await connectDB();
  const opts = session ? { session } : {};
  await CouponUsage.create([{ couponId, userId, orderId }], opts);
  await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } }, opts);
}
