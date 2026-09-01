"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { resetPassword } from "@/actions/user.action";
import {
    Eye,
    EyeOff,
    Lock,
    Loader2,
    KeyRound,
    CheckCircle2,
    ArrowLeft,
} from "lucide-react";

const resetPasswordSchema = z
    .object({
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

function ResetPasswordInner() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
    });

    if (!token) {
        return (
            <Card className="w-full max-w-md border-border/40 bg-card/95 shadow-2xl backdrop-blur-sm">
                <CardHeader className="space-y-4 pb-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/5">
                        <KeyRound className="h-7 w-7 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Invalid link
                        </CardTitle>
                        <CardDescription className="text-base text-muted-foreground">
                            This password reset link is invalid or has expired.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <Link href="/forgot-password" className="w-full">
                        <Button className="h-11 w-full">Request a new link</Button>
                    </Link>
                    <Link href="/login" className="w-full">
                        <Button variant="outline" className="h-11 w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to sign in
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md border-border/40 bg-card/95 shadow-2xl backdrop-blur-sm">
                <CardHeader className="space-y-4 pb-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 ring-4 ring-green-500/5">
                        <CheckCircle2 className="h-7 w-7 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Password updated!
                        </CardTitle>
                        <CardDescription className="text-base text-muted-foreground">
                            Your password has been successfully reset. You can now sign in
                            with your new password.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Link href="/login" className="w-full">
                        <Button className="h-11 w-full">Go to sign in</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    const onSubmit = async (data: ResetPasswordInput) => {
        setIsSubmitting(true);
        try {
            await resetPassword(token, data.password);
            setIsSuccess(true);
            toast.success("Password reset successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to reset password. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-md border-border/40 bg-card/95 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-4 pb-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                    <KeyRound className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        Set new password
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        Enter your new password below
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* New Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">
                            New Password
                        </Label>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="password"
                                {...register("password")}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
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
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="flex items-center gap-1 text-sm text-destructive">
                                {errors.password.message}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Must be at least 8 characters
                        </p>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium">
                            Confirm New Password
                        </Label>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                {...register("confirmPassword")}
                                type={showConfirm ? "text" : "password"}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                className={`h-12 pl-11 pr-12 transition-all focus-visible:ring-primary ${errors.confirmPassword
                                        ? "border-destructive focus-visible:ring-destructive"
                                        : ""
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((v) => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                tabIndex={-1}
                                aria-label={showConfirm ? "Hide password" : "Show password"}
                            >
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="flex items-center gap-1 text-sm text-destructive">
                                {errors.confirmPassword.message}
                            </p>
                        )}
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
                                Resetting...
                            </span>
                        ) : (
                            "Reset Password"
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
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-16">
            {/* Background decoration */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-primary/5 blur-[100px]" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />
            </div>

            <Suspense
                fallback={
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                }
            >
                <ResetPasswordInner />
            </Suspense>
        </div>
    );
}
