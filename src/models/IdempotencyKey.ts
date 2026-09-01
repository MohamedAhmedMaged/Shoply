import mongoose, { Schema, Document } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string;
  response: string;
  statusCode: number;
  createdAt: Date;
}

const idempotencyKeySchema = new Schema<IIdempotencyKey>({
  key: { type: String, required: true, unique: true, index: true },
  response: { type: String, required: true },
  statusCode: { type: Number, required: true },
}, { timestamps: true });

idempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.IdempotencyKey || mongoose.model<IIdempotencyKey>('IdempotencyKey', idempotencyKeySchema);
