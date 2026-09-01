"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
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
import { requestPasswordReset } from "@/actions/user.action";
import { Mail, Loader2, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordInner() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordInput) => {
        setIsSubmitting(true);
        try {
            const result = await requestPasswordReset(data.email);
            if (result.success) {
                setIsSuccess(true);
                toast.success("Reset link sent!");
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        const email = getValues("email");
        return (
            <Card className="w-full max-w-md border-border/40 bg-card/95 shadow-2xl backdrop-blur-sm">
                <CardHeader className="space-y-4 pb-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 ring-4 ring-green-500/5">
                        <CheckCircle2 className="h-7 w-7 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Check your inbox
                        </CardTitle>
                        <CardDescription className="text-base text-muted-foreground">
                            We sent a password reset link to{" "}
                            <span className="font-semibold text-foreground">{email}</span>
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Click the link in the email to set a new password. The link will
                        expire in 1 hour.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t see the email? Check your spam folder or{" "}
                        <button
                            onClick={() => {
                                setIsSuccess(false);
                            }}
                            className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
                        >
                            try again
                        </button>
                        .
                    </p>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Link href="/login" className="w-full">
                        <Button variant="outline" className="h-11 w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to sign in
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md border-border/40 bg-card/95 shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-4 pb-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                    <KeyRound className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        Forgot password?
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        Enter your email and we&apos;ll send you a link to reset your
                        password
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                            <p className="flex items-center gap-1 text-sm text-destructive">
                                {errors.email.message}
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
                                Sending link...
                            </span>
                        ) : (
                            "Send Reset Link"
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

export default function ForgotPasswordPage() {
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
                <ForgotPasswordInner />
            </Suspense>
        </div>
    );
}
