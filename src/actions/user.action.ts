"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { User } from "@/models";
import bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { registerSchema, profileSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validators";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  try {
    const validated = registerSchema.parse(data);

    await connectDB();
    const existing = await User.findOne({ email: validated.email });
    if (existing) throw new Error("Email already registered");

    const hashedPassword = await bcrypt.hash(validated.password, 12);
    const user = await User.create({
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
      role: validated.role || "CUSTOMER",
    });

    revalidateTag("users");
    return { id: user._id.toString(), email: user.email, name: user.name, role: user.role };
  } catch (error: any) {
    console.error("Error registering user:", error);
    throw new Error(error.message || "Failed to register user");
  }
}

export async function updateUserProfile(data: {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const validated = profileSchema.parse(data);

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { ...validated },
      { new: true }
    ).select("id name email role avatar phone").lean() as any;

    if (!user) throw new Error("User not found");
    revalidateTag("users");
    return JSON.parse(JSON.stringify({ ...user, id: user._id.toString() }));
  } catch (error: any) {
    console.error("Error updating profile:", error);
    throw new Error(error.message || "Failed to update profile");
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const { rateLimit, getRateLimitKey } = await import("@/lib/rateLimit");
    const rateLimitResult = await rateLimit(getRateLimitKey(session.user.id, "change-password"), {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    });
    if (!rateLimitResult.allowed) {
      throw new Error("Too many password change attempts. Please try again later.");
    }

    const validated = changePasswordSchema.parse({ currentPassword, newPassword });

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) throw new Error("User not found");
    if (!user.password) throw new Error("Cannot change password for social login accounts.");

    const isValid = await bcrypt.compare(validated.currentPassword, user.password);
    if (!isValid) throw new Error("Current password is incorrect");

    user.password = await bcrypt.hash(validated.newPassword, 12);
    await user.save();
    return { success: true };
  } catch (error: any) {
    console.error("Error changing password:", error);
    throw new Error(error.message || "Failed to change password");
  }
}

const addressActionSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().default('US'),
  isDefault: z.boolean().default(false),
});

export async function addAddress(data: z.infer<typeof addressActionSchema>) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    await connectDB();
    // Use atomic operators instead of loading full doc + save
    if (data.isDefault) {
      await User.updateOne(
        { _id: session.user.id },
        { $set: { "address.$[].isDefault": false } },
      );
    }
    await User.updateOne(
      { _id: session.user.id },
      { $push: { address: data } },
    );

    const user = await User.findById(session.user.id).select("address").lean() as any;
    return { success: true, addresses: user?.address || [] };
  } catch (error: any) {
    console.error("Error adding address:", error);
    throw new Error(error.message || "Failed to add address");
  }
}

export async function updateAddress(addressId: string, data: z.infer<typeof addressActionSchema>) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    await connectDB();
    // Use atomic operators: clear defaults then update the matched array element
    if (data.isDefault) {
      await User.updateOne(
        { _id: session.user.id },
        { $set: { "address.$[].isDefault": false } },
      );
    }
    await User.updateOne(
      { _id: session.user.id, "address._id": addressId },
      { $set: Object.fromEntries(Object.entries(data).map(([k, v]) => [`address.$.${k}`, v])) },
    );

    const user = await User.findById(session.user.id).select("address").lean() as any;
    return { success: true, addresses: user?.address || [] };
  } catch (error: any) {
    console.error("Error updating address:", error);
    throw new Error(error.message || "Failed to update address");
  }
}

export async function deleteAddress(addressId: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    await connectDB();
    // Use $pull instead of loading, filtering, and saving
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { address: { _id: addressId } },
    });

    const user = await User.findById(session.user.id).select("address").lean() as any;
    return { success: true, addresses: user?.address || [] };
  } catch (error: any) {
    console.error("Error deleting address:", error);
    throw new Error(error.message || "Failed to delete address");
  }
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(email: string) {
  try {
    const validated = forgotPasswordSchema.parse({ email });

    await connectDB();
    const user = await User.findOne({ email: validated.email })
      .select("+passwordResetTokenHash +passwordResetExpires") as any;

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, message: "If an account with that email exists, a reset link has been sent." };
    }

    // Only allow password reset for accounts with a password (not social login)
    if (!user.password) {
      return { success: true, message: "If an account with that email exists, a reset link has been sent." };
    }

    // Require verified email
    if (!user.emailVerified) {
      throw new Error("You must verify your email address before resetting your password. Please check your inbox for the verification link.");
    }

    // Rate limit: block if a reset was requested within the last 5 minutes (expiresAt is 60m in future)
    if (user.passwordResetExpires && new Date(user.passwordResetExpires).getTime() > Date.now() + 55 * 60 * 1000) {
      throw new Error("A reset link was recently sent. Please wait a few minutes before requesting another.");
    }

    // Generate token
    const rawToken = crypto.randomUUID();
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      passwordResetTokenHash: hashedToken,
      passwordResetExpires: expiresAt,
    });

    await sendPasswordResetEmail(user.email, user.name, rawToken);

    return { success: true, message: "If an account with that email exists, a reset link has been sent." };
  } catch (error: any) {
    // Re-throw known user-facing errors
    if (error.message?.includes("verify your email") || error.message?.includes("recently sent")) {
      throw error;
    }
    console.error("Error requesting password reset:", error);
    throw new Error("Failed to process your request. Please try again.");
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const validated = resetPasswordSchema.parse({ token, password: newPassword });

    const hashedToken = hashToken(validated.token);

    await connectDB();
    const user = await User.findOne({
      passwordResetTokenHash: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpires");

    if (!user) {
      throw new Error("This reset link is invalid or has expired. Please request a new one.");
    }

    user.password = await bcrypt.hash(validated.password, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();

    return { success: true };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0]?.message || "Invalid input");
    }
    console.error("Error resetting password:", error);
    throw new Error(error.message || "Failed to reset password");
  }
}
