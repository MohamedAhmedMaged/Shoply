export const metadata = {
  title: "Terms of Service - Shoply",
  description: "Shoply's terms of service outline the rules and regulations for using our platform.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Terms of <span className="text-accent">Service</span>
        </h1>
        <p className="mt-4 text-muted-foreground">Last updated: January 2026</p>
      </section>

      <section className="mt-12 space-y-6 text-muted-foreground">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="mt-3">
            By accessing or using Shoply, you agree to be bound by these Terms of Service and all applicable laws
            and regulations. If you do not agree with any of these terms, you are prohibited from using or
            accessing this site.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">2. Use of the Service</h2>
          <p className="mt-3">
            You must be at least 18 years old to use Shoply. By using the service, you represent and warrant that
            you meet this requirement. You agree to use the service only for lawful purposes and in a way that
            does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the service.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">3. Account Registration</h2>
          <p className="mt-3">
            To access certain features, you must create an account. You agree to provide accurate, current, and
            complete information during registration and to keep your account information updated. You are
            responsible for safeguarding your password and for any activity on your account.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">4. Purchases and Payment</h2>
          <p className="mt-3">
            All purchases made through Shoply are subject to our acceptance. We reserve the right to refuse or
            cancel any order for any reason, including pricing errors, suspected fraud, or insufficient inventory.
            Prices are subject to change without notice. You agree to pay all charges incurred on your account.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">5. Shipping and Returns</h2>
          <p className="mt-3">
            Shipping and delivery terms are outlined in our Shipping & Delivery policy. Returns and refunds are
            governed by our Returns & Refunds policy. By placing an order, you agree to these terms.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">6. Intellectual Property</h2>
          <p className="mt-3">
            The content, organization, graphics, design, compilation, and other matters related to Shoply are
            protected under applicable copyrights, trademarks, and other proprietary rights. You may not copy,
            reproduce, republish, upload, post, transmit, or distribute such material without our prior written consent.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">7. User Content</h2>
          <p className="mt-3">
            You may submit reviews, comments, and other content as long as such content is not illegal, obscene,
            threatening, defamatory, or otherwise objectionable. You grant Shoply a non-exclusive, royalty-free,
            perpetual, and irrevocable right to use, reproduce, and display such content in connection with the service.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">8. Prohibited Conduct</h2>
          <p className="mt-3">You agree not to:</p>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            <li>Use the service for any unlawful purpose or in violation of any laws</li>
            <li>Attempt to gain unauthorized access to any portion of the service</li>
            <li>Use any robot, spider, or other automated device to access the service</li>
            <li>Interfere with or disrupt the service or servers or networks connected to the service</li>
            <li>Impersonate any person or entity or falsely state your affiliation</li>
            <li>Upload viruses or other harmful code</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">9. Termination</h2>
          <p className="mt-3">
            We reserve the right to terminate or suspend your account and access to the service at any time,
            without notice, for conduct that we believe violates these Terms or is otherwise harmful to other users.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">10. Disclaimers and Limitation of Liability</h2>
          <p className="mt-3">
            The service is provided on an "as is" and "as available" basis without warranties of any kind. To the
            fullest extent permitted by law, Shoply shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising from your use of the service.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">11. Governing Law</h2>
          <p className="mt-3">
            These terms shall be governed by and construed in accordance with the laws of the State of New York,
            without regard to its conflict of law provisions.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">12. Contact Us</h2>
          <p className="mt-3">
            If you have any questions about these Terms of Service, please contact us at
            <a href="mailto:legal@shoply.com" className="ml-1 text-accent hover:underline">legal@shoply.com</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
