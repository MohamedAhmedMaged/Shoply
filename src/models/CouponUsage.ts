import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICouponUsage extends Document {
  couponId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  createdAt: Date;
}

const couponUsageSchema = new Schema<ICouponUsage>({
  couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
}, { timestamps: true });

couponUsageSchema.index({ couponId: 1, userId: 1 });

export default mongoose.models.CouponUsage || mongoose.model<ICouponUsage>('CouponUsage', couponUsageSchema);
