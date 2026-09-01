"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  updateUserProfile,
  changePassword,
  addAddress,
  deleteAddress,
} from "@/actions/user.action";
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  Lock,
  BadgeCheck,
  AlertCircle,
  Package,
  Heart,
  MapPin,
  Plus,
  Trash2,
  Calendar,
  ChevronRight,
  Store,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const user = session?.user as any;
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // New address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    isDefault: false,
  });

  // Fetch user addresses on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const json = await res.json();
          if (json.success?.data) {
            const profile = json.success;
            setPhone(profile.data?.phone || "");
            setAddresses(profile.data?.address || []);
          } else if (json.data) {
            setPhone(json.data?.phone || "");
            setAddresses(json.data?.address || []);
          }
        }
      } catch { }
      setLoadingAddresses(false);
    }
    fetchProfile();
  }, []);

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <User className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium text-foreground">
          Please sign in
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You need to be logged in to view your profile
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({ name, phone });
      toast.success("Profile updated");
      update();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in both password fields");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        toast.success("Verification email sent! Check your inbox.");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Could not resend. Try again later.");
      }
    } catch {
      toast.error("Could not resend. Try again later.");
    } finally {
      setResending(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      toast.error("Please fill in all address fields");
      return;
    }
    setSaving(true);
    try {
      const result = await addAddress(newAddress);
      setAddresses(result.addresses || []);
      setShowAddressForm(false);
      setNewAddress({ label: "", street: "", city: "", state: "", zipCode: "", country: "US", isDefault: false });
      toast.success("Address added");
    } catch (err: any) {
      toast.error(err.message || "Failed to add address");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const result = await deleteAddress(addressId);
      setAddresses(result.addresses || []);
      toast.success("Address removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address");
    }
  };

  const isVerified = Boolean(user.emailVerified);
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          My Profile
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your personal information, passwords, and addresses
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Profile Summary + Quick Links */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Card */}
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center">
              <Avatar className="mx-auto h-20 w-20">
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-3 text-lg font-semibold text-foreground">
                {user.name}
              </h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {user.role?.toLowerCase()}
                </Badge>
                {isVerified ? (
                  <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
                    <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                ) : (
                  <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-300">
                    <AlertCircle className="mr-1 h-3 w-3" /> Unverified
                  </Badge>
                )}
              </div>
              {memberSince && (
                <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Member since {memberSince}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Link
                href="/orders"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  My Orders
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-400" />
                  Wishlist
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/cart"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCartIcon className="h-4 w-4 text-accent" />
                  Shopping Cart
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              {(user.role === "SELLER" || user.role === "ADMIN") && (
                <Link
                  href="/seller"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-400" />
                    Seller Dashboard
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-accent" />
                    Admin Panel
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* ──────── Email Verification Banner ──────── */}
          {!isVerified && (
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-amber-500/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                    <AlertCircle className="h-5 w-5 text-amber-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      Email not verified
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Verify your email address to unlock the following features:
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Package className="h-4 w-4 text-primary" />
                          Order Updates
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Get real-time email notifications when your order status changes
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Lock className="h-4 w-4 text-primary" />
                          Password Reset
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Securely reset your password if you ever forget it
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Store className="h-4 w-4 text-primary" />
                          Seller Features
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Become a seller and start listing your products
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Heart className="h-4 w-4 text-primary" />
                          Wishlist Sync
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Sync your wishlist across all your devices
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="default">
                        <Link href="/verify-email">Verify Now</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResendVerification}
                        disabled={resending}
                      >
                        {resending ? (
                          <>Sending...</>
                        ) : (
                          <>
                            <Mail className="mr-2 h-3 w-3" />
                            Resend verification email
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ──────── Personal Information ──────── */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your name, email, and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="mr-1 inline h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-muted/50"
                  />
                  {!isVerified && (
                    <p className="flex items-center gap-1 text-xs text-amber-400">
                      <AlertCircle className="h-3 w-3" />
                      Not verified —{" "}
                      <button
                        onClick={handleResendVerification}
                        disabled={resending}
                        className="underline transition-colors hover:text-amber-300"
                      >
                        {resending ? "sending..." : "resend verification"}
                      </button>
                    </p>
                  )}
                  {isVerified && (
                    <p className="flex items-center gap-1 text-xs text-emerald-400">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2 sm:max-w-xs">
                <Label htmlFor="phone">
                  <Phone className="mr-1 inline h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* ──────── Saved Addresses ──────── */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Saved Addresses
                </CardTitle>
                <CardDescription>
                  Manage your shipping addresses for faster checkout
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddressForm(!showAddressForm)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Address Form */}
              {showAddressForm && (
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Label (e.g. Home, Work)</Label>
                      <Input
                        value={newAddress.label}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, label: e.target.value })
                        }
                        placeholder="Home"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newAddress.isDefault}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              isDefault: e.target.checked,
                            })
                          }
                          className="rounded border-border"
                        />
                        Set as default
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Street</Label>
                    <Input
                      value={newAddress.street}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, street: e.target.value })
                      }
                      placeholder="123 Main St, Apt 4B"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">City</Label>
                      <Input
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, city: e.target.value })
                        }
                        placeholder="New York"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">State</Label>
                      <Input
                        value={newAddress.state}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, state: e.target.value })
                        }
                        placeholder="NY"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ZIP Code</Label>
                      <Input
                        value={newAddress.zipCode}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            zipCode: e.target.value,
                          })
                        }
                        placeholder="10001"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddAddress} disabled={saving}>
                      {saving ? "Adding..." : "Save Address"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddressForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Address List */}
              {loadingAddresses ? (
                <p className="text-sm text-muted-foreground">Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <div className="flex flex-col items-center rounded-lg border border-dashed border-border/50 py-8 text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    No addresses saved yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add a shipping address for faster checkout
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr: any, idx: number) => (
                    <div
                      key={addr._id || idx}
                      className="flex items-start justify-between rounded-lg border border-border/50 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {addr.label || "Address"}
                          </p>
                          {addr.isDefault && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-primary/30 text-primary"
                            >
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {addr.street}
                          {addr.city && `, ${addr.city}`}
                          {addr.state && `, ${addr.state}`}{" "}
                          {addr.zipCode}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteAddress(addr._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ──────── Change Password ──────── */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={saving}
                variant="default"
              >
                <Shield className="mr-2 h-4 w-4" />
                {saving ? "Updating..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
