"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import { Package, Calendar, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OrderTimeline from "@/components/OrderTimeline";

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PROCESSING: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  SHIPPED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  DELIVERED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  CANCELLED: "bg-destructive/20 text-destructive border-destructive/30",
  REFUNDED: "bg-muted/20 text-muted-foreground border-muted",
};

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
};

async function fetchOrders() {
  return apiFetch<{ data: Order[]; pagination: { page: number; totalPages: number; total: number } }>("/api/orders");
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  const orders = data?.data || [];
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [timelines, setTimelines] = useState<Record<string, any[]>>({});
  const [loadingTimelines, setLoadingTimelines] = useState<Record<string, boolean>>({});

  const toggleTimeline = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
    if (!timelines[orderId]) {
      setLoadingTimelines((prev) => ({ ...prev, [orderId]: true }));
      try {
        const data = await apiFetch<any[]>(
          `/api/orders/${orderId}/timeline`,
        );
        setTimelines((prev) => ({ ...prev, [orderId]: data || [] }));
      } catch {
        setTimelines((prev) => ({ ...prev, [orderId]: [] }));
      } finally {
        setLoadingTimelines((prev) => ({ ...prev, [orderId]: false }));
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Orders</h1>
        <p className="mt-1 text-muted-foreground">
          Track and manage your orders
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="mt-4 border-t border-border/50 pt-4">
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
                      <div className="space-y-1">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No orders yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start shopping to see your orders here
            </p>
            <a href="/products" className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Browse Products
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id} className="border-border/50 transition-all hover:border-primary/30">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{order.orderNumber}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" />
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      className={`border ${statusColors[order.status] || "bg-muted text-muted-foreground border-muted"}`}
                    >
                      {order.status}
                    </Badge>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                </div>

                {order.items?.length > 0 && (
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {order.items.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                          <div className="aspect-square h-10 w-10 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name || "Product"}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex items-center rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                          +{order.items.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Timeline Toggle */}
                <div className="mt-4 border-t border-border/50 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTimeline(order.id)}
                    className="w-full justify-between text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-xs font-medium">Order Timeline</span>
                    {expandedOrder === order.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  {expandedOrder === order.id && (
                    <div className="mt-3 rounded-lg bg-muted/20 p-4">
                      {loadingTimelines[order.id] ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      ) : (
                        <OrderTimeline
                          currentStatus={order.status}
                          history={timelines[order.id]?.map((h: any) => ({
                            status: h.toStatus,
                            createdAt: h.createdAt,
                          }))}
                        />
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
