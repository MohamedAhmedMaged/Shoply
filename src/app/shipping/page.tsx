import { Clock, Globe, Package, Truck } from "lucide-react";

export const metadata = {
  title: "Shipping & Delivery - Shoply",
  description: "Information about Shoply's shipping options, delivery times, and costs.",
};

const shippingOptions = [
  {
    icon: Truck,
    name: "Standard Shipping",
    time: "5-7 business days",
    cost: "Free on orders over $50, otherwise $4.99",
  },
  {
    icon: Package,
    name: "Express Shipping",
    time: "2-3 business days",
    cost: "$9.99",
  },
  {
    icon: Globe,
    name: "International Shipping",
    time: "10-15 business days",
    cost: "Calculated at checkout",
  },
  {
    icon: Clock,
    name: "Next Day Delivery",
    time: "1 business day (order by 2pm EST)",
    cost: "$19.99",
  },
];

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Shipping & <span className="text-accent">Delivery</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Everything you need to know about how your order gets to you.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-foreground">Shipping Options</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {shippingOptions.map((option) => (
            <div key={option.name} className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <option.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{option.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{option.time}</p>
              <p className="mt-3 text-sm font-medium text-foreground">{option.cost}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Frequently Asked Questions</h2>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">How is my order shipped?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            All orders are shipped via our trusted carrier partners, including USPS, UPS, FedEx, and DHL for international orders. We select the best carrier based on your location and chosen shipping method.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">When will my order be processed?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Orders are processed within 1-2 business days. You will receive a confirmation email with tracking information as soon as your order leaves our warehouse. Please note that orders placed on weekends or holidays will be processed the next business day.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">Do you offer free shipping?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Yes! Standard shipping is free on all domestic orders over $50. We also run frequent promotions with free expedited shipping — sign up for our newsletter to be the first to know.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">Can I change my shipping address?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You can update your shipping address within 12 hours of placing your order by contacting our support team. Once an order has shipped, we are unable to change the delivery address.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">What if my package is lost or damaged?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            In the rare event your package is lost in transit or arrives damaged, please contact us within 7 days of the expected delivery date. We'll work with the carrier to locate your package or send a replacement at no cost.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">Do you ship to PO boxes?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Yes, we ship to PO boxes via USPS. Please note that expedited shipping options may not be available for PO box addresses.
          </p>
        </div>
      </section>
    </div>
  );
}
