"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  UserPlus,
  Store,
  ShoppingBag,
  Loader2,
} from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  role: z.enum(["CUSTOMER", "SELLER"]).default("CUSTOMER"),
});

type RegisterInput = z.infer<typeof registerSchema>;

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole =
    searchParams.get("role") === "SELLER" ? "SELLER" : "CUSTOMER";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: defaultRole as "CUSTOMER" | "SELLER" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterInput) => {
    setIsSubmitting(true);
    try {
      // 1. Register
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Registration failed");
        setIsSubmitting(false);
        return;
      }

      // 2. Auto sign-in
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.success("Account created! Please sign in manually.");
        router.push("/login");
        return;
      }

      // 3. Notify & redirect
      const emailSent = result?.data?.emailVerificationSent;
      toast.success(
        emailSent
          ? "Account created! Check your email to verify your address."
          : "Account created successfully!",
      );

      if (emailSent) {
        router.push("/verify-email");
      } else {
        const role = data.role || "CUSTOMER";
        router.push(role === "SELLER" ? "/seller" : "/profile");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/40 bg-card/95 shadow-2xl backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
          <UserPlus className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Create Account
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Join us to start shopping or selling
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                {...register("name")}
                placeholder="John Doe"
                autoComplete="name"
                className={`h-12 pl-11 transition-all focus-visible:ring-primary ${errors.name
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                  }`}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                {...register("email")}
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                className={`h-12 pl-11 transition-all focus-visible:ring-primary ${errors.email
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                  }`}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className={`h-12 pl-11 pr-12 transition-all focus-visible:ring-primary ${errors.password
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">I want to</Label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setValue("role", "CUSTOMER")}
                className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-4 transition-all hover:border-primary/50 ${selectedRole === "CUSTOMER"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:bg-accent/50"
                  }`}
              >
                <ShoppingBag
                  className={`h-6 w-6 transition-colors ${selectedRole === "CUSTOMER"
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                    }`}
                />
                <span
                  className={`text-sm font-semibold ${selectedRole === "CUSTOMER"
                      ? "text-primary"
                      : "text-foreground"
                    }`}
                >
                  Shop
                </span>
                <span className="text-center text-xs text-muted-foreground leading-tight">
                  Browse & buy products
                </span>
              </button>

              <button
                type="button"
                onClick={() => setValue("role", "SELLER")}
                className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-4 transition-all hover:border-primary/50 ${selectedRole === "SELLER"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:bg-accent/50"
                  }`}
              >
                <Store
                  className={`h-6 w-6 transition-colors ${selectedRole === "SELLER"
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                    }`}
                />
                <span
                  className={`text-sm font-semibold ${selectedRole === "SELLER"
                      ? "text-primary"
                      : "text-foreground"
                    }`}
                >
                  Sell
                </span>
                <span className="text-center text-xs text-muted-foreground leading-tight">
                  List & sell products
                </span>
              </button>
            </div>
            <input type="hidden" {...register("role")} />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="h-12 w-full text-base font-semibold shadow-lg transition-all hover:shadow-xl active:scale-[0.99]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-2">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 text-muted-foreground">or</span>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            Sign in here
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterForm() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterFormInner />
    </Suspense>
  );
}
