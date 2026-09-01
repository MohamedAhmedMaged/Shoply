"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useCart } from "@/features/cart/components/CartProvider";
import { useState } from "react";
import { toast } from "sonner";
import WishlistButton from "@/features/wishlist/components/WishlistButton";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    images: string[];
    stock: number;
    category: { name: string };
    _count?: { reviews: number };
    avgRating?: number;
    sellerId?: string | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession();
  const { addItem } = useCart();
  const isOwner = !!product.sellerId && !!session?.user?.id && product.sellerId === session.user.id;
  const [adding, setAdding] = useState(false);

  const discount = product.comparePrice
    ? Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100,
      )
    : 0;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addItem(product.id, 1, {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        comparePrice: product.comparePrice,
        images: product.images,
        stock: product.stock,
      });
      toast.success("Added to cart");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {discount > 0 && (
            <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground border-0">
              -{discount}%
            </Badge>
          )}
          {isOwner && (
            <Badge className="absolute right-3 top-3 bg-primary/80 text-white border-0">
              Your Product
            </Badge>
          )}
          {!isOwner && (
            <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
              <WishlistButton
                productId={product.id}
                variant="icon-overlay"
                size="sm"
              />
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Badge variant="destructive" className="text-sm">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <Link href={`/products/${product.slug}`}>
          <p className="text-xs text-muted-foreground">
            {product.category?.name || "Uncategorized"}
          </p>
          <h3 className="mt-1 text-sm font-medium text-foreground line-clamp-2 transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(product.price)}
          </span>
          {product.comparePrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.comparePrice)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href={`/products/${product.slug}`}>
                <Pencil className="mr-2 h-3 w-3" />
                Manage
              </Link>
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                disabled={product.stock === 0 || adding}
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToCart();
                }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {adding ? "Adding..." : "Add to Cart"}
              </Button>
              <WishlistButton
                productId={product.id}
                variant="icon"
                size="md"
                className="h-9 w-9"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
