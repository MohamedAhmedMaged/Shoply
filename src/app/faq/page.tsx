"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    category: "Orders & Shipping",
    items: [
      {
        q: "How long does shipping take?",
        a: "Standard shipping typically takes 5-7 business days within the US. Express shipping is available at checkout for 2-3 business day delivery. International orders usually arrive within 10-15 business days.",
      },
      {
        q: "Can I track my order?",
        a: "Yes! Once your order ships, you'll receive a confirmation email with a tracking number. You can also view real-time status updates in your account under My Orders.",
      },
      {
        q: "Do you ship internationally?",
        a: "We currently ship to over 50 countries. Shipping fees and delivery times vary by destination and are calculated at checkout.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    items: [
      {
        q: "What is your return policy?",
        a: "We accept returns within 30 days of delivery for most items. Products must be unused and in their original packaging. See our Returns & Refunds page for full details.",
      },
      {
        q: "How do I initiate a return?",
        a: "Go to My Orders in your account, select the order, and click 'Request Return'. You'll receive a prepaid shipping label via email within 24 hours.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 5-7 business days after we receive and inspect your return. The funds will be credited to your original payment method.",
      },
    ],
  },
  {
    category: "Account & Payment",
    items: [
      {
        q: "Is it free to create an account?",
        a: "Yes! Creating a Shoply account is completely free. You'll get access to order tracking, wishlists, faster checkout, and exclusive member deals.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover), PayPal, Apple Pay, Google Pay, and Shoply Gift Cards.",
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. All transactions are encrypted with industry-standard SSL technology, and we never store your full card details on our servers.",
      },
    ],
  },
  {
    category: "Selling on Shoply",
    items: [
      {
        q: "How do I become a seller?",
        a: "Click 'Become a Seller' in the footer, create a seller account, and complete our simple onboarding process. You'll be ready to list products in minutes.",
      },
      {
        q: "What are the fees for sellers?",
        a: "Shoply charges a small commission on each sale. There are no monthly fees or setup costs. You only pay when you make a sale.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Frequently Asked <span className="text-accent">Questions</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Quick answers to the most common questions about Shoply.
        </p>
      </section>

      <section className="mt-12 space-y-10">
        {faqs.map((group) => (
          <div key={group.category}>
            <h2 className="text-xl font-semibold text-foreground">{group.category}</h2>
            <div className="mt-4 space-y-2">
              {group.items.map((item) => {
                const key = `${group.category}-${item.q}`;
                const isOpen = openIndex === key;
                return (
                  <div
                    key={key}
                    className="overflow-hidden rounded-xl border border-border/50 bg-card"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-medium text-foreground md:text-base">{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-border/50 px-5 py-4">
                        <p className="text-sm text-muted-foreground md:text-base">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-16 rounded-2xl border border-border/50 bg-card p-8 text-center">
        <h2 className="text-xl font-semibold text-foreground">Still have questions?</h2>
        <p className="mt-2 text-muted-foreground">
          Can't find the answer you're looking for? Our support team is happy to help.
        </p>
        <a
          href="/contact"
          className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          Contact our support team →
        </a>
      </section>
    </div>
  );
}
