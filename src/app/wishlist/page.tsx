"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWishlist } from "@/features/wishlist/hooks/useWishlist";
import { useCart } from "@/features/cart/components/CartProvider";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Heart,
  X,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Loader2,
} from "lucide-react";
import ProductCard from "@/features/products/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import {
  clearWishlist as clearWishlistAction,
  removeFromWishlist,
} from "@/actions/wishlist.action";
import { addToCart } from "@/actions/cart.action";
import { useState, useEffect } from "react";

type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
  category: { name: string } | null;
};

type WishlistItem = {
  id: string;
  productId: WishlistProduct | null;
  createdAt: string | null;
};

async function fetchWishlist() {
  return apiFetch<WishlistItem[]>("/api/wishlist");
}

export default function WishlistPage() {
  const { isAuthenticated, ids, remove, clearGuest } = useWishlist();
  const { addItem } = useCart();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [guestItems, setGuestItems] = useState<WishlistItem[]>([]);

  // Fetch auth wishlist
  const { data: authItems, isLoading: authLoading } = useQuery({
    queryKey: ["wishlist", session?.user?.id],
    queryFn: fetchWishlist,
    enabled: isAuthenticated,
  });

  // Load guest wishlist products from localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      const guestIds = Array.from(ids);
      if (guestIds.length === 0) {
        setGuestItems([]);
        return;
      }
      // Fetch product details for guest wishlist items
      const fetchProducts = async () => {
        const results: (WishlistItem | null)[] = await Promise.all(
          guestIds.map(async (productId) => {
            try {
              const res = await fetch(`/api/products/${productId}`);
              const json = await res.json();
              if (json.success && json.data) {
                return {
                  id: `guest_${productId}`,
                  productId: {
                    id: json.data.id || json.data._id,
                    name: json.data.name,
                    slug: json.data.slug,
                    price: json.data.price,
                    comparePrice: json.data.comparePrice || null,
                    images: json.data.images || [],
                    stock: json.data.stock,
                    category: json.data.categoryId
                      ? { name: json.data.categoryId.name }
                      : null,
                  },
                  createdAt: null,
                };
              }
            } catch {
              // product may be deleted
            }
            return null;
          }),
        );
        setGuestItems(results.filter((r): r is WishlistItem => r !== null));
      };
      fetchProducts();
    }
  }, [isAuthenticated, ids]);

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-ids"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-count"] });
      toast.success("Removed from wishlist");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to remove item");
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearWishlistAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-ids"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-count"] });
      toast.success("Wishlist cleared");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to clear wishlist");
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: (input: { productId: string; quantity: number }) =>
      addToCart(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("Added to cart");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to add to cart");
    },
  });

  const isLoading = isAuthenticated ? authLoading : false;
  const list = isAuthenticated ? (authItems || []) : guestItems;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24">
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              Your wishlist is empty
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Save items you love for later
            </p>
            <Button asChild className="mt-6" variant="default">
              <Link href="/products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Browse Products
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableItems = list.filter(
    (item) => item.productId && item.productId.stock > 0,
  );
  const unavailableItems = list.filter(
    (item) => !item.productId || item.productId.stock === 0,
  );

  const handleRemove = (productId: string) => {
    if (isAuthenticated) {
      removeMutation.mutate(productId);
    } else {
      remove(productId);
    }
  };

  const handleClear = () => {
    if (isAuthenticated) {
      clearMutation.mutate();
    } else {
      clearGuest();
      toast.success("Wishlist cleared");
    }
  };

  const handleAddToCart = (productId: string) => {
    if (isAuthenticated) {
      addToCartMutation.mutate({ productId, quantity: 1 });
    } else {
      addItem(productId, 1);
      toast.success("Added to cart");
    }
  };

  const moveAllAvailableToCart = () => {
    availableItems.forEach((item) => {
      if (item.productId) {
        handleAddToCart(item.productId.id);
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Wishlist
          </h1>
          <p className="mt-1 text-muted-foreground">
            {list.length} item{list.length !== 1 ? "s" : ""} saved
            {unavailableItems.length > 0 &&
              ` (${unavailableItems.length} unavailable)`}
            {!isAuthenticated && (
              <Badge variant="outline" className="ml-2 text-xs">
                Guest
              </Badge>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {availableItems.length > 0 && (
            <Button
              variant="default"
              onClick={moveAllAvailableToCart}
              disabled={addToCartMutation.isPending}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add all available to cart
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={clearMutation.isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear wishlist
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {list.map((item) =>
          item.productId ? (
            <div key={item.id} className="relative group">
              <ProductCard
                product={{
                  ...item.productId,
                  category: item.productId.category || { name: "" },
                }}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-3 top-3 h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemove(item.productId!.id);
                }}
                disabled={removeMutation.isPending}
                aria-label="Remove from wishlist"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
