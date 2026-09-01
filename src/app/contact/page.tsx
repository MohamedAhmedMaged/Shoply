"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, MessageSquare, Phone, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type FormState = { name: string; email: string; subject: string; message: string };
type Status = "idle" | "sending" | "sent" | "error";

const EMPTY: FormState = { name: "", email: "", subject: "", message: "" };

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrors({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const fieldErrors = data?.errors || {};
        const flat: Partial<Record<keyof FormState, string>> = {};
        (Object.keys(fieldErrors) as Array<keyof FormState>).forEach((k) => {
          const arr = fieldErrors[k];
          if (Array.isArray(arr) && arr.length > 0) flat[k] = arr[0];
        });
        setErrors(flat);
        toast.error(data?.error || "Could not send your message. Please try again.");
        setStatus("error");
        return;
      }
      toast.success("Message sent! Check your inbox for a confirmation.");
      setForm(EMPTY);
      setStatus("sent");
    } catch {
      toast.error("Network error. Please try again.");
      setStatus("error");
    }
  };

  const sending = status === "sending";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Get in <span className="text-accent">Touch</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Have a question, feedback, or need help? We&apos;d love to hear from you.
        </p>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">Email</h3>
          <p className="mt-1 text-sm text-muted-foreground">Our team will reply within 24 hours.</p>
          <a href="mailto:support@shoply.com" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
            support@shoply.com
          </a>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Phone className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">Phone</h3>
          <p className="mt-1 text-sm text-muted-foreground">Mon-Fri, 9am-6pm EST.</p>
          <a href="tel:+15551234567" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
            +1 (555) 123-4567
          </a>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <MapPin className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">Office</h3>
          <p className="mt-1 text-sm text-muted-foreground">Visit us at our headquarters.</p>
          <p className="mt-3 text-sm font-medium text-accent">123 Commerce St, NY 10001</p>
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold text-foreground">Why reach out?</h2>
          <p className="mt-3 text-muted-foreground">
            Whether you&apos;re a customer with a question about an order, a seller looking for support,
            or a partner interested in working with us — our team is here to help.
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-foreground">Order Support</p>
                <p className="text-sm text-muted-foreground">Track shipments, change addresses, or report issues.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-foreground">Seller Inquiries</p>
                <p className="text-sm text-muted-foreground">Get help with your storefront, products, or payouts.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-foreground">Partnerships</p>
                <p className="text-sm text-muted-foreground">Press, business, and integration opportunities.</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/50 bg-card p-6 lg:col-span-3">
          <h2 className="text-xl font-semibold text-foreground">Send us a message</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="Your full name"
                required
                disabled={sending}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="you@example.com"
                required
                disabled={sending}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={form.subject}
              onChange={handleChange("subject")}
              placeholder="What's this about?"
              required
              disabled={sending}
              aria-invalid={!!errors.subject}
            />
            {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              value={form.message}
              onChange={handleChange("message")}
              placeholder="Tell us how we can help..."
              required
              disabled={sending}
              rows={6}
              aria-invalid={!!errors.message}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
          </div>
          <Button type="submit" variant="accent" disabled={sending} className="w-full sm:w-auto">
            {status === "sending" ? (
              <>Sending...</>
            ) : status === "sent" ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Message Sent
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Send Message
              </>
            )}
          </Button>
          {status === "sent" && (
            <p className="text-sm text-emerald-400">
              Thanks for reaching out! We&apos;ll get back to you shortly. You can safely send another message anytime.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
