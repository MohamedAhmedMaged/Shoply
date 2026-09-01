export const metadata = {
  title: "Privacy Policy - Shoply",
  description: "Shoply's privacy policy explains how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Privacy <span className="text-accent">Policy</span>
        </h1>
        <p className="mt-4 text-muted-foreground">Last updated: January 2026</p>
      </section>

      <section className="mt-12 space-y-6 text-muted-foreground">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
          <p className="mt-3">
            We collect information you provide directly to us, such as when you create an account, make a purchase,
            subscribe to our newsletter, or contact customer support. This may include your name, email address,
            postal address, phone number, payment information, and any other information you choose to provide.
          </p>
          <p className="mt-3">
            We also automatically collect certain information when you visit our website, including your IP address,
            browser type, operating system, referring URLs, and information about how you interact with our site.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
          <p className="mt-3">We use the information we collect to:</p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>Process and fulfill your orders</li>
            <li>Send you order confirmations, shipping updates, and customer service communications</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Improve our website, products, and services</li>
            <li>Detect and prevent fraud or other illegal activities</li>
            <li>Comply with legal obligations</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">3. Sharing of Your Information</h2>
          <p className="mt-3">
            We do not sell or rent your personal information to third parties. We may share your information with:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>Service providers who help us operate our business (payment processors, shipping carriers, etc.)</li>
            <li>Sellers on our platform, but only the information necessary to fulfill your order</li>
            <li>Law enforcement or government agencies when required by law</li>
            <li>Other parties in connection with a business transaction (merger, acquisition, etc.)</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">4. Cookies and Tracking</h2>
          <p className="mt-3">
            We use cookies and similar tracking technologies to collect information about your browsing activities.
            You can control cookies through your browser settings, though disabling them may limit your ability to
            use certain features of our site.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
          <p className="mt-3">
            We take the security of your information seriously and use industry-standard encryption (SSL/TLS) to
            protect data in transit. However, no method of transmission over the internet is 100% secure, and we
            cannot guarantee absolute security of your information.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">6. Your Rights and Choices</h2>
          <p className="mt-3">You have the right to:</p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>Access and update your account information at any time</li>
            <li>Opt out of marketing communications by clicking "unsubscribe" in any email</li>
            <li>Request deletion of your account and personal data</li>
            <li>Request a copy of the personal data we hold about you</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">7. Children's Privacy</h2>
          <p className="mt-3">
            Our service is not directed to children under 13, and we do not knowingly collect personal information
            from children under 13. If we learn we have collected such information, we will delete it promptly.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">8. Changes to This Policy</h2>
          <p className="mt-3">
            We may update this privacy policy from time to time. We will notify you of any material changes by
            posting the new policy on this page and updating the "Last updated" date above.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">9. Contact Us</h2>
          <p className="mt-3">
            If you have any questions about this privacy policy or our practices, please contact us at
            <a href="mailto:privacy@shoply.com" className="ml-1 text-accent hover:underline">privacy@shoply.com</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
