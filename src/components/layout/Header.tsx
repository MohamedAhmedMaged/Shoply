"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingCart,
  User,
  Heart,
  LogOut,
  Package,
  LayoutDashboard,
  Menu,
  BarChart3,
} from "lucide-react";
import { useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import SearchSuggestions from "@/components/SearchSuggestions";
import { useCart } from "@/features/cart/components/CartProvider";
import { useWishlist } from "@/features/wishlist/hooks/useWishlist";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isProductsPage = pathname === "/products" || pathname.startsWith("/products?");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const user = session?.user as any;
  const isAuthenticated = status === "authenticated";

  const { itemCount: cartCount } = useCart();
  const { count: wishlistBadge } = useWishlist();

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    nextAuthSignOut({ callbackUrl: "/" });
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="text-2xl font-bold tracking-tight">
              <span className="text-foreground">Shop</span>
              <span className="text-accent">ly</span>
            </div>
          </Link>

          {!isProductsPage && (
            <div className="hidden md:flex flex-1 max-w-md">
              <SearchSuggestions
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={(val) => {
                  if (val.trim()) {
                    router.push(`/products?search=${encodeURIComponent(val.trim())}`);
                  }
                }}
                inputClassName="bg-muted/50 border-border/50 focus:border-primary"
              />
            </div>
          )}

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Products
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link href="/wishlist" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Heart className="h-5 w-5" />
              {wishlistBadge > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 min-w-5 flex items-center justify-center rounded-full p-0 text-[10px] bg-rose-500 text-white border-0">
                  {wishlistBadge > 99 ? "99+" : wishlistBadge}
                </Badge>
              )}
            </Link>

            <Link href="/cart" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 min-w-5 flex items-center justify-center rounded-full p-0 text-[10px] bg-accent text-accent-foreground border-0">
                  {cartCount > 99 ? "99+" : cartCount}
                </Badge>
              )}
            </Link>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[120px] truncate text-sm font-medium md:inline">
                      {user?.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" /> My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">
                      <Package className="mr-2 h-4 w-4" /> Orders
                    </Link>
                  </DropdownMenuItem>
                  {(user?.role === "SELLER" || user?.role === "ADMIN") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/seller" className="text-emerald-400">
                          <BarChart3 className="mr-2 h-4 w-4" /> Seller Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user?.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="text-accent">
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="accent" size="sm" className="hidden md:flex">
                <Link href="/login">Sign In</Link>
              </Button>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="flex flex-col gap-4 mt-6">
                  {!isProductsPage && (
                    <div className="px-1">
                      <SearchSuggestions
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSearch={(val) => {
                          if (val.trim()) {
                            router.push(`/products?search=${encodeURIComponent(val.trim())}`);
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1 px-1">
                    <Link
                      href="/products"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Products
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Wishlist
                      {wishlistBadge > 0 && (
                        <Badge variant="accent" className="ml-auto">{wishlistBadge}</Badge>
                      )}
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Cart
                      {cartCount > 0 && (
                        <Badge variant="accent" className="ml-auto">{cartCount}</Badge>
                      )}
                    </Link>
                  </div>

                  {isAuthenticated ? (
                    <div className="flex flex-col gap-1 px-1">
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        Orders
                      </Link>
                      {(user?.role === "SELLER" || user?.role === "ADMIN") && (
                        <Link
                          href="/seller"
                          onClick={() => setMobileOpen(false)}
                          className="rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-muted"
                        >
                          Seller Dashboard
                        </Link>
                      )}
                      {user?.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="rounded-lg px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-muted"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-muted"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="px-1">
                      <Button asChild variant="accent" className="w-full">
                        <Link href="/login" onClick={() => setMobileOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
