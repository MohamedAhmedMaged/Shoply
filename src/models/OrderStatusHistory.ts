import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrderStatusHistory extends Document {
  orderId: Types.ObjectId;
  fromStatus: string | null;
  toStatus: string;
  changedBy?: string;
  note?: string;
  createdAt: Date;
}

const orderStatusHistorySchema = new Schema<IOrderStatusHistory>({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  fromStatus: { type: String, default: null },
  toStatus: { type: String, required: true },
  changedBy: String,
  note: String,
}, { timestamps: true });

orderStatusHistorySchema.index({ orderId: 1, createdAt: 1 });

export default mongoose.models.OrderStatusHistory || mongoose.model<IOrderStatusHistory>('OrderStatusHistory', orderStatusHistorySchema);
