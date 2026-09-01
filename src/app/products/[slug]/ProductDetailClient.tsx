"use client";

import { useCart } from "@/features/cart/components/CartProvider";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import {
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  Pencil,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import WishlistButton from "@/features/wishlist/components/WishlistButton";

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    comparePrice: number | null;
    images: string[];
    stock: number;
    slug: string;
    category: { name: string };
    seller: { name: string };
    reviews: Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
      user: { name: string; avatar: string | null };
    }>;
  };
  isOwner?: boolean;
}

export default function ProductDetailClient({
  product,
  isOwner = false,
}: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const handleAddToCart = async () => {
    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }
    if (quantity > product.stock) {
      toast.error(
        `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available in stock`,
      );
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(product.id, quantity, {
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
      toast.error(err.message || "Failed to add to cart");
    }
    setAddingToCart(false);
  };

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

  const discount = product.comparePrice
    ? Math.round(
        ((product.comparePrice - product.price) / product.comparePrice) * 100,
      )
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-xl bg-muted relative">
            <Image
              src={product.images[selectedImage] || "/placeholder.svg"}
              alt={product.name}
              width={600}
              height={600}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    idx === selectedImage
                      ? "border-primary"
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  <Image
                    src={img}
                    alt=""
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">
                {product.category?.name || "Uncategorized"}
              </Badge>
              {isOwner && (
                <Badge className="bg-primary/80 text-white border-0">
                  Your Product
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sold by{" "}
              <span className="font-medium text-foreground">
                {product.seller?.name}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-foreground">
              {formatCurrency(product.price)}
            </span>
            {product.comparePrice && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  {formatCurrency(product.comparePrice)}
                </span>
                <Badge variant="accent">-{discount}%</Badge>
              </>
            )}
          </div>

          {avgRating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} ({product.reviews.length} reviews)
              </span>
            </div>
          )}

          <p className="text-muted-foreground">{product.description}</p>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" />
              <span>Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>30-day return policy</span>
            </div>
          </div>

          {product.stock > 0 ? (
            <Badge variant="success" className="text-sm">
              In Stock ({product.stock} available)
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-sm">
              Out of Stock
            </Badge>
          )}

          {product.stock > 0 && (
            <div className="flex items-center gap-4">
              {isOwner ? (
                <div className="flex w-full gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/seller/products`}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="default" className="flex-1">
                    <Link href={`/products/${product.slug}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Product
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center rounded-lg border border-border/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none"
                      onClick={() =>
                        setQuantity(Math.min(product.stock, quantity + 1))
                      }
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="flex-1"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {addingToCart ? "Adding..." : "Add to Cart"}
                  </Button>
                  <WishlistButton
                    productId={product.id}
                    variant="icon"
                    size="md"
                    className="h-10 w-10 border border-input"
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {product.reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground">
            Reviews ({product.reviews.length})
          </h2>
          <div className="mt-6 space-y-4">
            {product.reviews.map((review) => (
              <Card key={review.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {review.user.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {review.user.name}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
