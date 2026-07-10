import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Globe,
  Hand,
  Inbox,
  LayoutPanelLeft,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/hero-section/reveal";
import { Hero } from "@/components/hero-section/Hero";
import { SiteHeader } from "@/components/hero-section/SiteHeader";
import { BrandMark } from "@/components/hero-section/brand-mark";

export const metadata: Metadata = {
  title: {
    absolute:
      "MyChat — AI customer support that answers from your knowledge base",
  },
  description:
    "MyChat is an AI customer-support desk: an embeddable chat + helpdesk widget, a website crawler that builds your knowledge base, lead capture, and a shared team inbox with human takeover. Start free.",
  openGraph: {
    title: "MyChat — AI customer support, done right",
    description:
      "Deploy an AI agent that answers from your knowledge base, capture leads, and hand off to your team — all from one embeddable widget. Start free.",
    type: "website",
    siteName: "MyChat",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyChat — AI customer support that answers from your knowledge base",
    description:
      "An embeddable AI chat + helpdesk widget, website crawler, lead capture, and a shared team inbox with human takeover. Start free.",
  },
};

const FEATURES = [
  {
    icon: Bot,
    title: "An AI agent that actually knows your product",
    body: "Answers instantly from your knowledge base — accurate, on-brand, available 24/7. No more copy-pasting the same reply a hundred times.",
    span: "lg:col-span-3",
  },
  {
    icon: Globe,
    title: "Website crawler + helpdesk",
    body: "Point it at your site and it builds the knowledge base for you. Add and edit articles to fine-tune every answer.",
    span: "lg:col-span-3",
  },
  {
    icon: LayoutPanelLeft,
    title: "Embeddable widget",
    body: "Chat and Helpdesk in one. Match your colors, logo, and copy, then drop a single snippet on any page.",
    span: "lg:col-span-2",
  },
  {
    icon: UserPlus,
    title: "Built-in lead capture",
    body: "Collect names, emails, and context — and turn support traffic into qualified pipeline.",
    span: "lg:col-span-2",
  },
  {
    icon: Inbox,
    title: "Shared team inbox",
    body: "Every conversation in one place, with assignment and roles so the right teammate owns the right chat.",
    span: "lg:col-span-2",
  },
] as const;

const STEPS = [
  {
    icon: Globe,
    title: "Connect your knowledge",
    body: "Crawl your website and add helpdesk articles. MyChat builds a knowledge base your AI agent answers from.",
  },
  {
    icon: LayoutPanelLeft,
    title: "Customize & embed",
    body: "Style the widget to match your brand, then paste one snippet onto your site. You're live in minutes.",
  },
  {
    icon: Inbox,
    title: "Resolve & take over",
    body: "The AI answers, captures leads, and routes the rest to your shared inbox — where your team takes over instantly.",
  },
] as const;

const STATS = [
  { value: "73%", label: "of tickets resolved by AI" },
  { value: "8s", label: "average first reply" },
  { value: "2,000+", label: "teams onboard" },
  { value: "24/7", label: "always-on coverage" },
] as const;

const LOGOS = [
  "Northwind",
  "Acme Co",
  "Globex",
  "Initech",
  "Umbrella",
  "Hooli",
  "Soylent",
  "Vehement",
];

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <Features />
      <Stats />
      <HowItWorks />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}

// ── Logo marquee ──────────────────────────────────────────────────────────────
function LogoMarquee() {
  return (
    <section className="border-b border-border/60 py-12">
      <div className="mx-auto w-full max-w-6xl px-6">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by support teams everywhere
        </p>
        <div className="mask-fade-x relative mt-7 flex overflow-hidden">
          <div className="animate-marquee pause-hover flex shrink-0 items-center gap-14 pr-14">
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="text-xl font-semibold tracking-tight text-muted-foreground/55 whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features (bento) ──────────────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="scroll-mt-24">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-tight text-brand">
            Everything you need
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            One desk for{" "}
            <span className="font-display italic font-normal">AI answers</span>{" "}
            and human support
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-pretty text-muted-foreground">
            From the first automated reply to a teammate stepping in, MyChat
            covers the whole conversation.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06} className={f.span}>
              <FeatureCard {...f} />
            </Reveal>
          ))}
          {/* Wide closing feature */}
          <Reveal delay={0.3} className="lg:col-span-6">
            <div className="group relative flex h-full flex-col items-start gap-6 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:border-brand/30 hover:shadow-elevated sm:flex-row sm:items-center sm:p-8">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand to-brand-2 text-white shadow-[0_8px_24px_-8px_var(--brand)]">
                <Hand className="size-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold tracking-tight">
                  Human takeover, any time
                </h3>
                <p className="mt-1.5 max-w-2xl text-muted-foreground">
                  The AI handles the volume; your team steps in seamlessly for
                  the conversations that need a person — with the full thread
                  and context already there.
                </p>
              </div>
              <div className="flex -space-x-2">
                {[
                  "from-rose-400 to-orange-400",
                  "from-sky-400 to-indigo-400",
                  "from-emerald-400 to-teal-400",
                ].map((c, idx) => (
                  <span
                    key={idx}
                    className={`flex size-9 items-center justify-center rounded-full bg-linear-to-br ${c} text-xs font-semibold text-white ring-2 ring-card`}
                  >
                    {["AI", "SR", "MJ"][idx]}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
  span,
}: {
  icon: typeof Bot;
  title: string;
  body: string;
  span: string;
}) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-elevated">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-brand/5 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-110 group-hover:bg-brand/15">
        <Icon className="size-5" />
      </div>
      <h3 className="relative mt-5 text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

// ── Stats (dark band) ─────────────────────────────────────────────────────────
function Stats() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6">
      <Reveal className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-white sm:px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="animate-aurora absolute -left-10 -top-20 size-72 rounded-full bg-brand/30 blur-[100px]" />
          <div
            className="animate-aurora absolute -bottom-24 right-0 size-72 rounded-full bg-brand-2/25 blur-[100px]"
            style={{ animationDelay: "-7s" }}
          />
        </div>
        <div className="relative grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-semibold tracking-tight text-gradient sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-white/55">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-tight text-brand">
            How it works
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Live in{" "}
            <span className="font-display italic font-normal">three steps</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-pretty text-muted-foreground">
            No engineering project. Connect, customize, embed.
          </p>
        </Reveal>

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          {/* Connecting line on desktop */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-px bg-linear-to-r from-transparent via-border to-transparent md:block"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1} className="relative">
              <div className="flex items-center gap-3">
                <span className="relative z-10 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-brand-2 text-base font-semibold text-white shadow-[0_8px_24px_-8px_var(--brand)] ring-4 ring-background">
                  {i + 1}
                </span>
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <s.icon className="size-5" />
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {s.body}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-14 flex justify-center">
          <Button
            asChild
            size="lg"
            className="group h-12 rounded-full bg-linear-to-br from-brand to-brand-2 px-7 text-base text-white shadow-[0_10px_40px_-10px_var(--brand)] hover:opacity-95"
          >
            <Link href="/sign-up">
              Get started free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCta() {
  const points = [
    "AI answers from your knowledge base",
    "Shared inbox with human takeover",
    "Embeddable in minutes",
  ];
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24 sm:pb-32">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-brand via-brand to-brand-2 px-8 py-16 text-center text-white sm:px-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(40rem 22rem at 80% -10%, rgba(255,255,255,0.4), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="grain pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        />
        <h2 className="relative mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Turn support into your{" "}
          <span className="font-display italic font-normal">best channel</span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-pretty text-base text-white/85 sm:text-lg">
          Join the teams resolving more conversations with less effort. Start
          free — upgrade when you grow.
        </p>
        <ul className="relative mx-auto mt-8 flex max-w-2xl flex-col items-center justify-center gap-3 text-sm sm:flex-row sm:gap-6">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Check className="size-4 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 w-full rounded-full bg-white px-7 text-base font-medium text-brand hover:bg-white/90 sm:w-auto"
          >
            <Link href="/sign-up">Start free</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 w-full rounded-full border-white/30 bg-transparent px-7 text-base text-white hover:bg-white/10 hover:text-white sm:w-auto"
          >
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
        <p className="relative mt-5 text-sm text-white/70">
          No credit card required · Free plan included
        </p>
      </Reveal>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-col items-start justify-between gap-10 sm:flex-row">
          <div className="max-w-xs">
            <Link href="/" aria-label="MyChat home">
              <BrandMark wordClassName="text-white" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              The AI customer-support desk for modern teams. Answers that feel
              human — and humans when it matters.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-14 gap-y-8 sm:grid-cols-3">
            <FooterCol title="Product">
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#how">How it works</FooterLink>
              <FooterLink href="/pricing">Pricing</FooterLink>
            </FooterCol>
            <FooterCol title="Get started">
              <FooterLink href="/sign-up">Start free</FooterLink>
              <FooterLink href="/sign-in">Sign in</FooterLink>
            </FooterCol>
            <FooterCol title="Company">
              <FooterLink href="#">About</FooterLink>
              <FooterLink href="#">Privacy</FooterLink>
              <FooterLink href="#">Terms</FooterLink>
            </FooterCol>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} MyChat. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-brand-2" />
            Built for support teams who care.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
        {title}
      </p>
      {children}
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-white/65 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}
