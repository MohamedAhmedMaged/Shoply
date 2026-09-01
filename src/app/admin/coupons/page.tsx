"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Tag, Plus, Trash2, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type Coupon = {
    id: string;
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    minOrderAmount: number;
    maxDiscount: number | null;
    usageLimit: number;
    usedCount: number;
    perUserLimit: number;
    expiresAt: string;
    isActive: boolean;
    createdAt: string;
};

async function fetchCoupons() {
    const res = await fetch("/api/admin/coupons");
    const result = await res.json();
    if (!result.success) throw new Error(result.error || "Failed to fetch");
    return result.data as { data: Coupon[]; pagination: any };
}

export default function AdminCouponsPage() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["admin-coupons"],
        queryFn: fetchCoupons,
    });

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        code: "",
        type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
        value: "",
        minOrderAmount: "0",
        maxDiscount: "",
        usageLimit: "0",
        perUserLimit: "1",
        expiresAt: "",
    });
    const [saving, setSaving] = useState(false);

    const coupons = data?.data || [];

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code || !form.value || !form.expiresAt) {
            toast.error("Code, value, and expiry date are required");
            return;
        }
        setSaving(true);
        try {
            await apiFetch("/api/admin/coupons", {
                method: "POST",
                body: JSON.stringify({
                    code: form.code,
                    type: form.type,
                    value: Number(form.value),
                    minOrderAmount: Number(form.minOrderAmount),
                    maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
                    usageLimit: Number(form.usageLimit),
                    perUserLimit: Number(form.perUserLimit),
                    expiresAt: form.expiresAt,
                }),
            });
            toast.success("Coupon created");
            setShowForm(false);
            setForm({ code: "", type: "PERCENTAGE", value: "", minOrderAmount: "0", maxDiscount: "", usageLimit: "0", perUserLimit: "1", expiresAt: "" });
            queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to create coupon");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (coupon: Coupon) => {
        try {
            await apiFetch("/api/admin/coupons", {
                method: "PATCH",
                body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
            });
            toast.success(coupon.isActive ? "Coupon deactivated" : "Coupon activated");
            queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
        } catch (err: any) {
            toast.error(err.message || "Failed to update coupon");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this coupon?")) return;
        try {
            await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
            toast.success("Coupon deleted");
            queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
        } catch {
            toast.error("Failed to delete coupon");
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Coupons</h1>
                    <p className="mt-1 text-muted-foreground">
                        Create and manage discount coupons
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Coupon
                </Button>
            </div>

            {/* Create Form */}
            {showForm && (
                <Card className="mb-8 border-border/50">
                    <CardContent className="pt-6">
                        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Code</Label>
                                <Input
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    placeholder="SUMMER20"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Type</Label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENTAGE" | "FIXED" })}
                                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="PERCENTAGE">Percentage</option>
                                    <option value="FIXED">Fixed Amount</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Value</Label>
                                <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.value}
                                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                                    placeholder={form.type === "PERCENTAGE" ? "20" : "10.00"}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Expires At</Label>
                                <Input
                                    type="date"
                                    value={form.expiresAt}
                                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Min Order Amount</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.minOrderAmount}
                                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Max Discount (leave empty for no limit)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.maxDiscount}
                                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                                    placeholder="No limit"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Usage Limit (0 = unlimited)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.usageLimit}
                                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Per User Limit</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={form.perUserLimit}
                                    onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                                />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                                <Button type="submit" disabled={saving}>
                                    {saving ? "Creating..." : "Create Coupon"}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Coupons List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                    ))}
                </div>
            ) : coupons.length === 0 ? (
                <Card className="border-border/50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Tag className="h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-medium text-foreground">No coupons yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create your first discount coupon to start promoting your store
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {coupons.map((coupon) => (
                        <Card key={coupon.id} className={`border-border/50 ${!coupon.isActive ? "opacity-60" : ""}`}>
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                        <Tag className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-foreground">{coupon.code}</span>
                                            <Badge variant={coupon.isActive ? "default" : "secondary"} className="text-[10px]">
                                                {coupon.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {coupon.type === "PERCENTAGE" ? `${coupon.value}% off` : formatCurrency(coupon.value)}
                                            {coupon.minOrderAmount > 0 && ` | Min: ${formatCurrency(coupon.minOrderAmount)}`}
                                            {coupon.maxDiscount && ` | Max: ${formatCurrency(coupon.maxDiscount)}`}
                                            {" | "}Used: {coupon.usedCount}/{coupon.usageLimit || "unlimited"}
                                            {" | "}Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleToggleActive(coupon)}
                                        title={coupon.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {coupon.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(coupon.id)}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
