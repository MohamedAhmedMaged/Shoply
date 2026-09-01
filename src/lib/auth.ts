import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { Role } from "@/types";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAuthUser(req?: NextRequest) {
  let session;
  if (req) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });
    if (token) {
      session = {
        user: {
          id: (token.id || token.sub) as string,
          email: token.email as string,
          role: token.role as Role,
        },
      };
    }
  } else {
    session = await getServerSession(authOptions);
  }
  
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role as Role,
  };
}

export function requireRole(user: Awaited<ReturnType<typeof getAuthUser>>, roles: string[]): void {
  if (!user) throw new Error("Unauthorized");
  if (!roles.includes(user.role)) throw new Error("Forbidden");
}
