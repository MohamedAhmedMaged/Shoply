"use client";

import { useCart } from "@/features/cart/components/CartProvider";
import type { NormalizedCartItem } from "@/stores/cart.store";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CartPage() {
  const {
    items,
    isLoading,
    isGuest,
    removeItem,
    updateQuantity,
  } = useCart();

  const subtotal = items.reduce(
    (sum: number, item: NormalizedCartItem) => sum + (item.productId?.price || 0) * item.quantity,
    0,
  );
  const shipping = subtotal > 50 ? 0 : 10;
  const tax = subtotal * 0.08;
  const totalCalc = subtotal + shipping + tax;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 space-y-2">
          <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 shrink-0 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="sticky top-24 rounded-xl border border-border/50 bg-card p-6 space-y-4">
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                </div>
                <div className="border-t border-border/50 pt-3">
                  <div className="flex justify-between">
                    <div className="h-5 w-14 animate-pulse rounded bg-muted" />
                    <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <h1 className="mt-6 text-2xl font-bold text-foreground">Your Cart is Empty</h1>
        <p className="mt-2 text-muted-foreground">
          Looks like you haven&apos;t added anything to your cart yet
        </p>
        <Button asChild variant="default" className="mt-6">
          <Link href="/products">
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Shopping Cart</h1>
        <p className="mt-1 text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""} in your cart
          {isGuest && (
            <Badge variant="outline" className="ml-2 text-xs">
              Guest Cart
            </Badge>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item: NormalizedCartItem) => (
            <Card key={item.id} className="border-border/50">
              <CardContent className="flex items-center gap-4 p-4">
                <Link href={`/products/${item.productId?.slug}`}>
                  <div className="aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={item.productId?.images?.[0] || "/placeholder.svg"}
                      alt={item.productId?.name || "Product"}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                </Link>

                <div className="flex flex-1 flex-col gap-1">
                  <Link href={`/products/${item.productId?.slug}`}>
                    <h3 className="font-medium text-foreground hover:text-primary transition-colors">
                      {item.productId?.name || "Unknown Product"}
                    </h3>
                  </Link>
                  {item.productId?.comparePrice && (
                    <Badge variant="accent" className="w-fit">
                      Sale
                    </Badge>
                  )}
                  {item.productId && (
                    <p className="text-xs text-muted-foreground">
                      {item.productId.stock > 0
                        ? `${item.productId.stock} in stock`
                        : "Out of stock"}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={item.quantity <= 1}
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1, item.productId?.id, item.variantId || undefined)
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={
                      !item.productId || item.quantity >= item.productId.stock
                    }
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1, item.productId?.id, item.variantId || undefined)
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <p className="min-w-[80px] text-right font-semibold text-foreground">
                  {formatCurrency((item.productId?.price || 0) * item.quantity)}
                </p>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeItem(item.id, item.productId?.id, item.variantId || undefined)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card className="sticky top-24 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-emerald-400">Free</span>
                    ) : (
                      formatCurrency(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (8%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="border-t border-border/50 pt-3">
                  <div className="flex justify-between text-base font-semibold text-foreground">
                    <span>Total</span>
                    <span>{formatCurrency(totalCalc)}</span>
                  </div>
                </div>
              </div>

              {subtotal < 50 && (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Add {formatCurrency(50 - subtotal)} more for free shipping
                </p>
              )}

              {isGuest && (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Sign in at checkout to save your cart
                </p>
              )}

              <Button asChild className="w-full" variant="default">
                <Link href="/checkout">
                  {isGuest ? "Proceed to Checkout (Login Required)" : "Proceed to Checkout"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
