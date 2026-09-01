import connectDB from "@/lib/db";
import RateLimit from "@/models/RateLimit";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

/**
 * MongoDB-based rate limiter.
 * Persists rate limit data in the database so it works across server instances.
 * Uses atomic findOneAndUpdate with $lt to prevent TOCTOU race conditions.
 * Uses TTL index for automatic cleanup of expired entries.
 */
export async function rateLimit(key: string, options: RateLimitOptions): Promise<{ allowed: boolean; resetTime: number }> {
  await connectDB();
  const now = new Date();

  // 1. Try to atomically increment an existing record within the window that has not reached limit
  const updated = await RateLimit.findOneAndUpdate(
    {
      key,
      resetTime: { $gt: now },
      count: { $lt: options.maxRequests },
    },
    { $inc: { count: 1 } },
    { new: true },
  );

  if (updated) {
    return { allowed: true, resetTime: updated.resetTime.getTime() };
  }

  // 2. Check if an active record already exists and has exceeded the limit
  const activeRecord = await RateLimit.findOne({
    key,
    resetTime: { $gt: now },
  });

  if (activeRecord) {
    return { allowed: false, resetTime: activeRecord.resetTime.getTime() };
  }

  // 3. No active record exists (or previous window expired) — create or reset atomically
  const resetTime = new Date(now.getTime() + options.windowMs);
  const created = await RateLimit.findOneAndUpdate(
    {
      key,
      $or: [
        { resetTime: { $lte: now } },
        { resetTime: { $exists: false } },
      ],
    },
    { key, count: 1, resetTime },
    { upsert: true, new: true },
  );

  return { allowed: true, resetTime: created.resetTime.getTime() };
}

export function getRateLimitKey(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`;
}
