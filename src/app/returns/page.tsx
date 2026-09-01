import { CheckCircle2, Package, RefreshCcw, XCircle } from "lucide-react";

export const metadata = {
  title: "Returns & Refunds - Shoply",
  description: "Shoply's return policy. Learn how to return items and get refunded.",
};

const steps = [
  {
    icon: Package,
    title: "Initiate Your Return",
    description: "Go to My Orders, select the item, and click 'Request Return' within 30 days of delivery.",
  },
  {
    icon: RefreshCcw,
    title: "Ship It Back",
    description: "Print the prepaid label we email you and drop off the package at any carrier location.",
  },
  {
    icon: CheckCircle2,
    title: "Get Refunded",
    description: "Once we receive and inspect your return, your refund is issued within 5-7 business days.",
  },
];

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Returns & <span className="text-accent">Refunds</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Not happy with your order? No problem. We make returns easy.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-border/50 bg-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foreground">Our 30-Day Return Policy</h2>
        <p className="mt-3 text-muted-foreground">
          You have 30 days from the date of delivery to return most items for a full refund. Items must be
          unused, in their original packaging, and in the same condition you received them. Once we receive
          and inspect your return, we'll notify you and issue your refund to the original payment method.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-foreground">How It Works</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={step.title} className="relative rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                  {idx + 1}
                </span>
                <step.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">Eligible for Return</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Unused items in original packaging</li>
            <li>• Items with all original tags attached</li>
            <li>• Defective or damaged products</li>
            <li>• Wrong items shipped</li>
            <li>• Unopened personal care items</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <XCircle className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">Non-Returnable Items</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Gift cards and digital products</li>
            <li>• Final sale or clearance items</li>
            <li>• Perishable goods and groceries</li>
            <li>• Personalized or custom products</li>
            <li>• Intimate apparel and swimwear</li>
          </ul>
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Common Questions</h2>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">Who pays for return shipping?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We provide a free prepaid return label for all domestic returns. International return shipping
            costs are the responsibility of the customer, except in cases of defective or incorrectly shipped items.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">When will I receive my refund?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Once your return is received and inspected, we'll send you an email confirmation. Refunds are
            typically processed within 5-7 business days and credited to your original payment method.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">Can I exchange an item?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The fastest way to exchange is to return the original item for a refund and place a new order
            for the item you want. This ensures you get the new item as quickly as possible.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">What if my item arrives damaged?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We're sorry! Please contact us within 7 days of delivery with photos of the damage. We'll send
            a replacement or issue a full refund — no return required.
          </p>
        </div>
      </section>
    </div>
  );
}
