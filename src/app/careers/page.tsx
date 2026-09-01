import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Heart, MapPin, Sparkles } from "lucide-react";

export const metadata = {
  title: "Careers - Shoply",
  description: "Join the Shoply team. Explore open positions and help us build the future of e-commerce.",
};

const perks = [
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Comprehensive medical, dental, and vision coverage for you and your family.",
  },
  {
    icon: MapPin,
    title: "Remote Friendly",
    description: "Work from home, our offices, or anywhere in between. We support flexible work.",
  },
  {
    icon: Sparkles,
    title: "Growth & Learning",
    description: "Annual learning stipend, mentorship programs, and clear paths to promotion.",
  },
  {
    icon: Briefcase,
    title: "Competitive Pay",
    description: "Top-of-market salaries, equity for all employees, and a 401(k) with company match.",
  },
];

const openings = [
  { title: "Senior Frontend Engineer", location: "Remote / New York, NY", type: "Full-time", team: "Engineering" },
  { title: "Product Designer", location: "Remote / New York, NY", type: "Full-time", team: "Design" },
  { title: "Backend Engineer (Payments)", location: "Remote", type: "Full-time", team: "Engineering" },
  { title: "Customer Support Specialist", location: "Remote", type: "Full-time", team: "Operations" },
  { title: "Data Analyst", location: "New York, NY", type: "Full-time", team: "Data" },
  { title: "Marketing Manager", location: "New York, NY", type: "Full-time", team: "Marketing" },
  { title: "Seller Success Manager", location: "Remote", type: "Full-time", team: "Operations" },
  { title: "DevOps Engineer", location: "Remote", type: "Full-time", team: "Engineering" },
];

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Build the Future of <span className="text-accent">Commerce</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Join a passionate team reimagining how people discover, buy, and sell products online.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="accent">
            <a href="#openings">View Open Roles</a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/about">About Shoply</Link>
          </Button>
        </div>
      </section>

      <section className="mt-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Why Work With Us</h2>
          <p className="mt-2 text-muted-foreground">Perks and benefits that put our team first.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((perk) => (
            <div key={perk.title} className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <perk.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{perk.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{perk.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="openings" className="mt-16 scroll-mt-20">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Open Positions</h2>
            <p className="mt-2 text-muted-foreground">{openings.length} roles available — find your fit.</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border/50 bg-card">
          {openings.map((job, idx) => (
            <div
              key={job.title}
              className={`flex flex-col items-start gap-3 p-5 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between ${
                idx !== openings.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <div>
                <h3 className="text-base font-semibold text-foreground">{job.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{job.team}</span>
                  <span>•</span>
                  <span>{job.location}</span>
                  <span>•</span>
                  <span>{job.type}</span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href="#" className="flex items-center gap-1">
                  Apply <ArrowRight className="h-3 w-3" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-accent/20 p-8 text-center md:p-12">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Don't see your role?</h2>
        <p className="mt-2 text-muted-foreground">
          We're always looking for exceptional people. Send us your resume and we'll be in touch.
        </p>
        <Button asChild variant="accent" className="mt-6">
          <Link href="/contact">Get in Touch</Link>
        </Button>
      </section>
    </div>
  );
}
