"use client";

import Link from "next/link";
import { XCircle, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <div className="rounded-full bg-destructive/20 p-3">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Checkout cancelled</h1>
          <p className="text-muted-foreground">
            Your payment was not completed. Your cart is still saved and items are still available.
          </p>
          <div className="mt-2 flex gap-2">
            <Button asChild variant="default">
              <Link href="/checkout">
                <ShoppingCart className="mr-2 h-4 w-4" /> Back to checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/products">Continue shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
