import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProductVariant extends Document {
  productId: Types.ObjectId;
  name: string;
  sku?: string;
  price?: number;
  stock: number;
  images?: string[];
  attributes: Map<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  name: { type: String, required: true },
  sku: String,
  price: Number,
  stock: { type: Number, default: 0 },
  images: [{ type: String }],
  attributes: { type: Map, of: String, default: {} },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productVariantSchema.index({ productId: 1, isActive: 1 });

export default mongoose.models.ProductVariant || mongoose.model<IProductVariant>('ProductVariant', productVariantSchema);
