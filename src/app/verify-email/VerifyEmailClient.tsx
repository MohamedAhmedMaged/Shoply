"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

type Status = "verifying" | "success" | "expired" | "invalid" | "already" | "idle";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [message, setMessage] = useState<string>("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (data?.data?.alreadyVerified) {
          setStatus("already");
          setMessage("Your email is already verified. You can sign in and start using Shoply.");
          return;
        }
        if (res.ok) {
          setStatus("success");
          setMessage("Your email has been verified. You can now sign in and enjoy Shoply.");
          return;
        }
        if (res.status === 410) {
          setStatus("expired");
          setMessage(data?.error || "This verification link has expired.");
          return;
        }
        setStatus("invalid");
        setMessage(data?.error || "Invalid verification link.");
      } catch {
        if (!cancelled) {
          setStatus("invalid");
          setMessage("Something went wrong. Please try again.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      if (res.ok) {
        toast.success("If that account exists and is unverified, a new link was sent.");
        setResendEmail("");
      } else {
        const data = await res.json();
        toast.error(data?.error || "Could not resend. Try again later.");
      }
    } catch {
      toast.error("Could not resend. Try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full border-border/50 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-3 pb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          {status === "verifying" ? (
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          ) : status === "success" || status === "already" ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          ) : (
            <XCircle className="h-7 w-7 text-destructive" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {status === "verifying" && "Verifying your email..."}
          {status === "success" && "Email verified"}
          {status === "already" && "Already verified"}
          {status === "expired" && "Link expired"}
          {status === "invalid" && "Invalid link"}
          {status === "idle" && "Verify your email"}
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          {status === "verifying" && "Hold on a moment while we confirm your address."}
          {(status === "success" || status === "already" || status === "expired" || status === "invalid") && message}
          {status === "idle" && (
            <>
              We sent a verification link when you signed up. Click the link in that email, or
              enter your address below to receive a new one.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(status === "success" || status === "already") && (
          <Button asChild className="w-full" variant="default">
            <Link href="/login">Continue to sign in</Link>
          </Button>
        )}

        {(status === "expired" || status === "invalid" || status === "idle") && (
          <form onSubmit={handleResend} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="resend-email">Email address</Label>
              <div className="relative">
                <MailCheck className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="resend-email"
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-11 pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={resending}>
              {resending ? "Sending..." : "Send new verification link"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Need help?{" "}
          <Link href="/contact" className="font-medium text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailClient() {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading...
      </div>
    }>
      <VerifyEmailInner />
    </Suspense>
  );
}
