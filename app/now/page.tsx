import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";

// ─────────────────────────────────────────────────────────────────
// /now page — Joshmann's monthly snapshot.
// EDIT THIS FILE MONTHLY. Update LAST_UPDATED + NEXT_UPDATE,
// then revise each section's content to reflect reality.
// Convention: https://nownownow.com
// ─────────────────────────────────────────────────────────────────

const LAST_UPDATED = "14 may 2026";
const NEXT_UPDATE = "june";

export const metadata: Metadata = {
  title: "Now",
  description:
    "What I'm currently building, learning, reading, and looking for. Updated monthly.",
  openGraph: {
    title: "Now · shipwithjosh.com",
    description:
      "What I'm currently building, learning, and looking for. Updated monthly.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Now · shipwithjosh.com",
    description: "What I'm currently building, learning, and looking for.",
  },
};

type NowItem = {
  headline: string;
  body: string;
  accent?: boolean;
};

const building: NowItem[] = [
  {
    headline: "LazyBull",
    body: "AI-simplified trading. Built, shipped, currently in conversations with potential buyers.",
    accent: true,
  },
  {
    headline: "shipwithjosh.com",
    body: "The site you're on. Iterating weekly until I stop noticing things to fix.",
  },
  {
    headline: "An AI trading co-pilot prototype",
    body: "Spike build. an overlay that watches charts and flags broken setups in real-time. Different angle from LazyBull.",
  },
];

const learning: NowItem[] = [
  {
    headline: "Agent workflows + tool use",
    body: "Anthropic SDK + Vercel AI SDK. Patterns for multi-step reasoning that don't fall apart at step three.",
  },
  {
    headline: "Quant fundamentals",
    body: "Backtesting, signal generation, position sizing. Quietly preparing for the trading-bots era.",
  },
  {
    headline: "Sales",
    body: "I built things. Now I'm learning to sell them. LazyBull is the practice run.",
  },
];

const reading: NowItem[] = [
  {
    headline: "Twitter threads, mostly",
    body: "AI / quant / founder-tools intersection. More signal there than in most books right now.",
  },
  {
    headline: "Re-reading: Zero to One",
    body: "For the contrarian thinking, not the Silicon Valley nostalgia.",
  },
  {
    headline: "LessWrong sequences",
    body: "Tab perpetually open for when I want a longer think.",
  },
];

const openTo: NowItem[] = [
  {
    headline: "Engineering / founding-eng roles at top startups",
    body: "Picky about teams. I want quality-obsessed places that ship.",
    accent: true,
  },
  {
    headline: "Select freelance",
    body: "AI products + animated marketing sites only.",
  },
  {
    headline: "LazyBull acquisition conversations",
    body: "Serious offers, real conversations.",
  },
  {
    headline: "Coffee with operators",
    body: "AI / quant / founder-tools space. especially if you've shipped something I'd recognize.",
  },
];

const helpWith: NowItem[] = [
  {
    headline: "Selling a small AI product",
    body: "If you've sold one. DM or email. I want unvarnished notes.",
  },
  {
    headline: "Second-brain systems at scale",
    body: "Show me what worked for you. Mine is still messy.",
  },
  {
    headline: "Hiring at a quality-obsessed startup?",
    body: "Email me. I read everything that lands in there.",
  },
];

export default function NowPage() {
  return (
    <main className="relative bg-bg">
      {/* Top chrome */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 pt-6 md:pt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-soft">
        <Link
          href="/"
          className="hover:text-accent transition-colors"
          data-cursor="hover"
        >
          shipwithjosh<span className="text-accent">.</span>com
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span>this page is alive</span>
        </div>

        <Link
          href="/"
          className="group flex items-center gap-2 hover:text-accent transition-colors"
          data-cursor="hover"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="transition-transform duration-500 group-hover:-translate-x-1"
          >
            <path
              d="M10 6H2M2 6L6 2M2 6L6 10"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="square"
            />
          </svg>
          back home
        </Link>
      </header>

      <ScrollReveal>
        {/* Heading */}
        <section className="relative px-6 md:px-12 pt-16 md:pt-28 pb-12 md:pb-16">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted reveal">
            // the now page · last updated {LAST_UPDATED} · check back in{" "}
            {NEXT_UPDATE}
          </div>

          <h1 className="mt-8 text-[clamp(2.75rem,11vw,9rem)] font-medium leading-[0.95] tracking-[-0.045em] reveal">
            What I&apos;m doing now
            <span className="text-accent">.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg md:text-xl text-fg-soft leading-relaxed reveal">
            A snapshot of what&apos;s actually consuming my attention. Updated
            monthly. If this page looks stale .{" "}
            <span className="text-fg">ping me, I probably forgot</span>.
          </p>
        </section>

        <NowSection eyebrow="// building" items={building} />
        <NowSection eyebrow="// learning" items={learning} />
        <NowSection eyebrow="// reading" items={reading} />

        <NowSectionRaw eyebrow="// where">
          <p className="text-lg md:text-xl text-fg leading-relaxed max-w-3xl">
            Chandigarh, India.{" "}
            <span className="text-fg-soft">UTC+5:30.</span> BTech at{" "}
            <span className="text-fg-soft">
              Newton School of Technology, Delhi.
            </span>
          </p>
        </NowSectionRaw>

        <NowSection eyebrow="// open to" items={openTo} />
        <NowSection eyebrow="// help me with" items={helpWith} />

        <NowSectionRaw eyebrow="// the vibe">
          <p className="text-2xl md:text-4xl font-medium tracking-[-0.025em] leading-tight max-w-3xl text-fg">
            Head down. Shipping.{" "}
            <span className="text-accent">
              One ear out for the right inbound.
            </span>
          </p>
        </NowSectionRaw>
      </ScrollReveal>

      {/* Footer */}
      <footer className="border-t border-line px-6 md:px-12 py-8 md:py-10 mt-12 md:mt-16">
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          <div className="flex items-center gap-3">
            <span>// inspired by</span>
            <a
              href="https://nownownow.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
              data-cursor="hover"
            >
              nownownow.com
            </a>
          </div>
          <Link
            href="/#contact"
            className="text-fg-soft hover:text-accent transition-colors"
            data-cursor="hover"
          >
            say hi →
          </Link>
        </div>
      </footer>
    </main>
  );
}

function NowSection({
  eyebrow,
  items,
}: {
  eyebrow: string;
  items: NowItem[];
}) {
  return (
    <section className="px-6 md:px-12 py-10 md:py-14 border-t border-line">
      <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted mb-8 reveal">
        {eyebrow}
      </div>
      <ul className="space-y-6 max-w-3xl reveal">
        {items.map((item) => (
          <li key={item.headline} className="flex gap-4">
            <span
              className={`mt-3 h-px w-4 flex-none ${
                item.accent ? "bg-accent" : "bg-line"
              }`}
            />
            <div className="flex-1">
              <h3
                className={`text-lg md:text-xl font-medium tracking-[-0.02em] leading-snug ${
                  item.accent ? "text-accent" : "text-fg"
                }`}
              >
                {item.headline}
              </h3>
              <p className="mt-1.5 text-base text-fg-soft leading-relaxed">
                {item.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NowSectionRaw({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-6 md:px-12 py-10 md:py-14 border-t border-line">
      <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted mb-6 reveal">
        {eyebrow}
      </div>
      <div className="reveal">{children}</div>
    </section>
  );
}
