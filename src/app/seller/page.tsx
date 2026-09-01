"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ShoppingCart, DollarSign, Plus, ListOrdered } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function SellerPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/seller/products").then((res) => res.json()).catch(() => ({ success: false })),
      fetch("/api/seller/orders").then((res) => res.json()).catch(() => ({ success: false })),
    ]).then(([productsRes, ordersRes]) => {
      const products = productsRes.success ? productsRes.data?.data || [] : [];
      const orders = ordersRes.success ? ordersRes.data?.data || [] : [];
      setDashboard({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
      });
      setLoading(false);
    });
  }, []);

  const statsCards = [
    {
      title: "Your Products",
      value: dashboard?.totalProducts ?? "—",
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      title: "Orders",
      value: dashboard?.totalOrders ?? "—",
      icon: ShoppingCart,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      title: "Revenue",
      value: dashboard?.totalRevenue ? formatCurrency(dashboard.totalRevenue) : "—",
      icon: DollarSign,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  const quickActions = [
    { href: "/seller/products", label: "Manage Products", icon: ListOrdered, description: "View and edit your products" },
    { href: "/seller/orders", label: "View Orders", icon: ShoppingCart, description: "Process incoming orders" },
    { href: "/products/create", label: "Add Product", icon: Plus, description: "List a new product" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Seller Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your products and track your sales
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
