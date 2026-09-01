import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  image: String,
  parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
}, { timestamps: true });

categorySchema.index({ parentId: 1 });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);
