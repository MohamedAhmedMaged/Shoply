"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Mail, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DISMISS_KEY = "shoplify.unverified-banner.dismissed";

function getDismissedFor(email?: string | null): boolean {
  if (typeof window === "undefined" || !email) return false;
  try {
    return window.sessionStorage.getItem(`${DISMISS_KEY}:${email}`) === "1";
  } catch {
    return false;
  }
}

function setDismissedFor(email?: string | null) {
  if (typeof window === "undefined" || !email) return;
  try {
    window.sessionStorage.setItem(`${DISMISS_KEY}:${email}`, "1");
  } catch {
    /* noop */
  }
}

export default function UnverifiedEmailBanner() {
  const { data: session, status } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (status !== "authenticated") return null;
  const user = session?.user as any;
  if (!user) return null;
  if (user.emailVerified) return null;
  if (dismissed || getDismissedFor(user.email)) return null;

  const handleResend = async () => {
    if (!user.email) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        toast.success("Verification email sent. Check your inbox.");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Could not resend. Try again later.");
      }
    } catch {
      toast.error("Could not resend. Try again later.");
    } finally {
      setSending(false);
    }
  };

  const dismiss = () => {
    setDismissed(true);
    setDismissedFor(user.email);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full border-b border-amber-500/30 bg-amber-50 dark:bg-amber-500/10"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 text-sm">
        <Mail className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="flex-1 text-amber-800 dark:text-amber-100">
          Please verify your email address to unlock all features.{" "}
          <Link href="/verify-email" className="font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-white">
            Learn more
          </Link>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={sending}
          className="h-8 px-3 text-amber-700 hover:bg-amber-500/20 hover:text-amber-950 dark:text-amber-100 dark:hover:text-white"
        >
          {sending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Sending
            </>
          ) : (
            "Resend email"
          )}
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-md p-1 text-amber-600/80 transition-colors hover:bg-amber-500/20 hover:text-amber-950 dark:text-amber-100/80 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
