import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { User } from '@/models';
import { sendVerificationEmail } from '@/lib/email';

export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashVerificationToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export function compareVerificationToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

export async function issueVerificationToken(userId: string): Promise<{ token: string; expires: Date }> {
  await connectDB();
  const token = generateVerificationToken();
  const tokenHash = await hashVerificationToken(token);
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await User.findByIdAndUpdate(userId, {
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: expires,
    emailVerified: null,
  });

  return { token, expires };
}

export async function sendVerificationForUser(userId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const user = await User.findById(userId).select('name email emailVerified');
  if (!user) return { ok: false, reason: 'User not found' };
  if (user.emailVerified) return { ok: false, reason: 'Email already verified' };

  const { token } = await issueVerificationToken(userId);
  await sendVerificationEmail(user.email, user.name, token);
  return { ok: true };
}

export type VerifyTokenResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'already-verified' | 'not-found' };

export async function consumeVerificationToken(token: string): Promise<VerifyTokenResult> {
  if (!token || typeof token !== 'string') return { ok: false, reason: 'invalid' };

  await connectDB();
  const candidate = await User.findOne({
    emailVerificationTokenHash: { $exists: true, $ne: null },
  })
    .select('+emailVerificationTokenHash +emailVerificationExpires')
    .sort({ emailVerificationExpires: -1 });

  if (!candidate) return { ok: false, reason: 'not-found' };
  if (candidate.emailVerified) return { ok: false, reason: 'already-verified' };
  if (!candidate.emailVerificationExpires || candidate.emailVerificationExpires.getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }
  if (!candidate.emailVerificationTokenHash) return { ok: false, reason: 'invalid' };

  const matches = await compareVerificationToken(token, candidate.emailVerificationTokenHash);
  if (!matches) return { ok: false, reason: 'invalid' };

  candidate.emailVerified = new Date();
  candidate.emailVerificationTokenHash = null;
  candidate.emailVerificationExpires = null;
  await candidate.save();

  return { ok: true, userId: candidate._id.toString() };
}
