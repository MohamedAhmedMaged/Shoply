"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/orders/by-session?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.success && j.data?.orderNumber) setOrderNumber(j.data.orderNumber);
      })
      .catch(() => {});
  }, [sessionId]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <div className="rounded-full bg-emerald-500/20 p-3">
            <CheckCircle className="h-12 w-12 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Payment successful</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We&apos;ll send you a confirmation email shortly.
          </p>
          {orderNumber && (
            <p className="text-sm text-muted-foreground">
              Order number: <span className="font-medium text-foreground">{orderNumber}</span>
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <Button asChild variant="default">
              <Link href="/orders">
                <Package className="mr-2 h-4 w-4" /> View orders
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
          Loading order details...
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
