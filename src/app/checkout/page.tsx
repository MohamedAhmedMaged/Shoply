"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder } from "@/actions/order.action";
import { formatCurrency } from "@/lib/utils";
import { CHECKOUT } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCart } from "@/features/cart/components/CartProvider";
import { CreditCard, Truck, MapPin, Mail, Phone, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type CartItem = {
  id: string;
  productId: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    images: string[];
    stock: number;
  } | null;
  quantity: number;
};

type Cart = {
  id: string;
  items: CartItem[];
};

async function fetchCart() {
  return apiFetch<Cart>("/api/cart");
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoading: cartStoreLoading, mergeComplete } = useCart();

  // Redirect guests to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  // Wait for cart merge to complete before fetching cart for checkout
  const isMergePending = status === "authenticated" && (!mergeComplete || cartStoreLoading);
  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ["cart", session?.user?.id],
    queryFn: fetchCart,
    enabled: !!session?.user?.id && !isMergePending,
  });
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "COD">("COD");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const isVerified = !!(session?.user as any)?.emailVerified;
  const items = (cart?.items || []) as CartItem[];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.productId?.price || 0) * item.quantity,
    0,
  );
  const shipping = subtotal > CHECKOUT.FREE_SHIPPING_THRESHOLD ? 0 : CHECKOUT.SHIPPING_COST;
  const tax = subtotal * CHECKOUT.TAX_RATE;
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal + shipping + tax - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const result = await apiFetch<{ valid: boolean; coupon?: { code: string; discount: number }; error?: string }>("/api/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: couponCode }),
      });
      if (result.valid && result.coupon) {
        setAppliedCoupon({ code: result.coupon.code, discount: result.coupon.discount });
        toast.success(`Coupon applied! You saved ${formatCurrency(result.coupon.discount)}`);
        setCouponCode("");
      } else {
        setCouponError(result.error || "Invalid coupon");
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Failed to validate coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await createOrder({
        paymentMethod,
        shippingAddress: address,
        email,
        couponCode: appliedCoupon?.code,
      });
      if (paymentMethod === "STRIPE" && (result as any).stripeUrl) {
        window.location.assign((result as any).stripeUrl);
        return;
      }
      toast.success("Order placed successfully!");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      router.push("/orders");
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <Truck className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <h1 className="mt-6 text-2xl font-bold text-foreground">Cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Add some items to your cart before checking out
        </p>
        <Button asChild className="mt-6" variant="default">
          <a href="/products">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 space-y-2">
          <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-64 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                <div className="h-11 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
          <div>
            <div className="sticky top-24 rounded-xl border border-border/50 bg-card p-6 space-y-4">
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-14 w-14 animate-pulse rounded-md bg-muted" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Checkout</h1>
        <p className="mt-1 text-muted-foreground">
          Complete your order by filling in the details below
        </p>
      </div>

      {!isVerified && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-amber-600 dark:text-amber-400">
              Email verification required
            </p>
            <p className="mt-1 text-muted-foreground">
              Please verify your email address before placing an order.{" "}
              <Link href="/verify-email" className="font-medium text-amber-600 underline underline-offset-2 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                Verify now
              </Link>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Address</Label>
                  <Input
                    id="street"
                    placeholder="123 Main St"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="10001"
                      value={address.zipCode}
                      onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="mr-1 inline h-4 w-4" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { value: "COD", label: "Cash on Delivery", icon: "💵" },
                  { value: "STRIPE", label: "Credit Card (Stripe)", icon: "💳" },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value as "STRIPE" | "COD")}
                    className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${paymentMethod === method.value
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
                      }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{method.label}</p>
                      {paymentMethod === method.value && (
                        <CheckCircle className="mt-1 h-4 w-4 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={item.productId?.images?.[0] || "/placeholder.svg"}
                        alt={item.productId?.name || "Product"}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                      <Badge className="absolute -right-2 -top-2 h-5 w-5 min-w-5 flex items-center justify-center rounded-full p-0 text-[10px] bg-muted text-foreground border-border">
                        {item.quantity}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.productId?.name}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency((item.productId?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border/50 pt-4 text-sm">
                {/* Coupon */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="font-medium text-emerald-300">{appliedCoupon.code}</span>
                      <span className="text-emerald-400">-{formatCurrency(appliedCoupon.discount)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-muted-foreground underline hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                      >
                        {validatingCoupon ? "..." : "Apply"}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-destructive">{couponError}</p>
                    )}
                  </div>
                )}

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
                  <span>Tax ({CHECKOUT.TAX_RATE * 100}%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="border-t border-border/50 pt-3">
                  <div className="flex justify-between text-base font-semibold text-foreground">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" variant="default" disabled={submitting || !isVerified}>
                {submitting ? "Processing..." : !isVerified ? "Verify email to order" : "Place Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
