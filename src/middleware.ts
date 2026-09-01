import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

async function getSessionUser(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });
    if (!token) return null;
    return {
      id: (token.id || token.sub) as string,
      role: token.role as string,
    };
  } catch {
    return null;
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const user = await getSessionUser(req);

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const roleRoutes: Record<string, string[]> = {
    "/admin": ["ADMIN"],
    "/seller": ["SELLER", "ADMIN"],
    "/api/admin": ["ADMIN"],
    "/api/seller": ["SELLER", "ADMIN"],
  };

  for (const [routePrefix, roles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      if (!roles.includes(user.role)) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { success: false, error: "Forbidden" },
            { status: 403 },
          );
        }
        return NextResponse.redirect(new URL("/", req.url));
      }
      break;
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", user.id);
  requestHeaders.set("x-user-role", user.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/seller",
    "/seller/:path*",
    "/profile",
    "/profile/:path*",
    "/orders",
    "/orders/:path*",
    "/checkout",
    "/checkout/:path*",
    "/api/admin",
    "/api/admin/:path*",
    "/api/seller",
    "/api/seller/:path*",
    "/api/checkout",
    "/api/checkout/:path*",
    "/api/orders",
    "/api/orders/:path*",
    "/api/wishlist",
    "/api/wishlist/:path*",
    "/api/upload",
  ],
};