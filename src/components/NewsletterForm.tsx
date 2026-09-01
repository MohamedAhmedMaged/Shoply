"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubscribing(true);
    setTimeout(() => {
      toast.success("Thank you for subscribing!");
      setEmail("");
      setSubscribing(false);
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-md gap-3">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <Button variant="accent" type="submit" disabled={subscribing}>
        {subscribing ? "Subscribing..." : "Subscribe"}
      </Button>
    </form>
  );
}
