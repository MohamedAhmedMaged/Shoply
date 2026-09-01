import mongoose, { Schema, Document } from 'mongoose';
import type { Role } from '@/types';

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  role: Role;
  avatar?: string;
  phone?: string;
  provider?: string;
  providerId?: string;
  emailVerified?: Date | null;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpires?: Date | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpires?: Date | null;
  address?: { label?: string; street: string; city: string; state: string; zipCode: string; country: string; isDefault?: boolean }[];
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema({
  label: String,
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'US' },
  isDefault: { type: Boolean, default: false },
}, { _id: true, timestamps: false });

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String },
  role: { type: String, enum: ['CUSTOMER', 'SELLER', 'ADMIN'], default: 'CUSTOMER' },
  avatar: String,
  phone: String,
  provider: String,
  providerId: String,
  emailVerified: { type: Date, default: null },
  emailVerificationTokenHash: { type: String, default: null, select: false },
  emailVerificationExpires: { type: Date, default: null, select: false },
  passwordResetTokenHash: { type: String, default: null, select: false },
  passwordResetExpires: { type: Date, default: null, select: false },
  address: [addressSchema],
}, { timestamps: true });

userSchema.index({ createdAt: -1 });

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
