import mongoose, { Schema, Document, Types } from 'mongoose';
import { ICartItem } from './CartItem';

export interface ICart extends Document {
  userId?: Types.ObjectId;
  guestId?: string;
  items: Types.DocumentArray<ICartItem>;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<ICart>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
  guestId: { type: String, unique: true, sparse: true },
  items: [{ type: Schema.Types.ObjectId, ref: 'CartItem' }],
  lastActiveAt: { type: Date, default: Date.now },
}, { timestamps: true });

cartSchema.index({ lastActiveAt: 1 });

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);
