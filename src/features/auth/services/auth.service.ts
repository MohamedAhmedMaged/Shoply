import connectDB from "@/lib/db";
import { User } from "@/models";
import {
  hashPassword,
  comparePassword,
} from "@/lib/auth";
import { RegisterInput, LoginInput, ProfileInput } from "@/lib/validators";
import { sendVerificationEmail } from "@/lib/email";
import { issueVerificationToken } from "@/lib/verification";

export async function registerUser(input: RegisterInput) {
  await connectDB();
  const existing = await User.findOne({ email: input.email });
  if (existing) throw new Error("Email already registered");

  const hashedPassword = await hashPassword(input.password);
  const user = await User.create({
    name: input.name,
    email: input.email,
    password: hashedPassword,
    role: input.role,
  });

  let verificationToken: string | undefined;
  try {
    const issued = await issueVerificationToken(user._id.toString());
    verificationToken = issued.token;
  } catch (err) {
    console.error("Failed to issue verification token:", err);
  }

  await Promise.allSettled([
    verificationToken
      ? sendVerificationEmail(user.email, user.name, verificationToken)
      : Promise.resolve(),
  ]);

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: null,
    },
    emailVerificationSent: Boolean(verificationToken),
  };
}

export async function loginUser(input: LoginInput) {
  await connectDB();
  const user = await User.findOne({ email: input.email });
  if (!user) throw new Error("Invalid credentials");
  if (!user.password) throw new Error("This account uses social login. Please sign in with Google or GitHub.");

  const isValid = await comparePassword(input.password, user.password);
  if (!isValid) throw new Error("Invalid credentials");

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      emailVerified: user.emailVerified ?? null,
    },
  };
}

export async function getUserProfile(userId: string) {
  await connectDB();
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");
  return user;
}

export async function updateUserProfile(userId: string, input: ProfileInput) {
  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    {
      name: input.name,
      email: input.email,
      phone: input.phone,
      avatar: input.avatar,
    },
    { new: true },
  ).select("id name email role avatar phone");
  if (!user) throw new Error("User not found");
  return user;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (!user.password) throw new Error("Cannot change password for social login accounts.");

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) throw new Error("Current password is incorrect");

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  await user.save();

  return { success: true };
}
