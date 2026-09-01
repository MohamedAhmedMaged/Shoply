import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  categoryId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  stock: number;
  sku?: string;
  hasVariants: boolean;
  variantAttributes: { name: string; values: string[] }[];
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  comparePrice: Number,
  images: [{ type: String }],
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  stock: { type: Number, default: 0 },
  sku: String,
  hasVariants: { type: Boolean, default: false },
  variantAttributes: [{ name: String, values: [String] }],
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ categoryId: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
