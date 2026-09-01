import mongoose, { Schema, Document } from 'mongoose';

export interface IRateLimit extends Document {
  key: string;
  count: number;
  resetTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const rateLimitSchema = new Schema<IRateLimit>({
  key: { type: String, required: true, unique: true, index: true },
  count: { type: Number, required: true, default: 0 },
  resetTime: { type: Date, required: true },
}, { timestamps: true });

rateLimitSchema.index({ resetTime: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RateLimit || mongoose.model<IRateLimit>('RateLimit', rateLimitSchema);
