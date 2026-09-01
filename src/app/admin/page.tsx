"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Users, Package, ShoppingCart, DollarSign, Image, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

async function getDashboardStats() {
  const res = await fetch("/api/admin/dashboard");
  const result = await res.json();
  return result.success ? result.data : null;
}

export default function AdminPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getDashboardStats,
  });

  const statsCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? "—",
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts ?? "—",
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders ?? "—",
      icon: ShoppingCart,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      title: "Revenue",
      value: stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : "—",
      icon: DollarSign,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  const managementLinks = [
    { href: "/admin/users", label: "Manage Users", icon: Users, description: "View and manage user accounts" },
    { href: "/admin/products", label: "Manage Products", icon: Package, description: "Edit or remove products" },
    { href: "/admin/orders", label: "Manage Orders", icon: ShoppingCart, description: "Update order statuses" },
    { href: "/admin/banners", label: "Manage Banners", icon: Image, description: "Homepage hero banners" },
    { href: "/admin/coupons", label: "Manage Coupons", icon: Tag, description: "Create and manage discount coupons" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your e-commerce platform
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {managementLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <link.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {link.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {link.description}
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
