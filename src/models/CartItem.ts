import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem extends Document {
  cartId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  cartId: { type: Schema.Types.ObjectId, ref: 'Cart', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
  quantity: { type: Number, default: 1, min: 1 },
}, { timestamps: true });

cartItemSchema.index({ cartId: 1, productId: 1, variantId: 1 }, { unique: true });
// TTL index: auto-cleanup orphaned cart items after 30 days
cartItemSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default mongoose.models.CartItem || mongoose.model<ICartItem>('CartItem', cartItemSchema);
