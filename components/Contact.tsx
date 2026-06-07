"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { fadeUp } from "@/lib/motion";
import { Magnetic } from "./Magnetic";

const EMAIL = "workaddressjosh@gmail.com";

const socials = [
  {
    platform: "x · twitter",
    handle: "@JoshDebugs",
    label: "best for shorter loops.",
    href: "https://x.com/JoshDebugs",
  },
  {
    platform: "github",
    handle: "JoshDebugs",
    label: "the work, raw.",
    href: "https://github.com/JoshDebugs",
  },
  {
    platform: "linkedin",
    handle: "josh dhiman",
    label: "for the recruiter circuit.",
    href: "https://www.linkedin.com/in/josh-dhiman-32a183383/",
  },
];

const meta = [
  { label: "location", value: "chandigarh, india" },
  { label: "timezone", value: "ist · utc+5:30" },
  { label: "status", value: "open to roles + select freelance" },
  { label: "response", value: "usually under 24h" },
];

export function Contact() {
  const [copied, setCopied] = useState(false);
  const lenis = useLenis();

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard
      .writeText(EMAIL)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  };

  const scrollToTop = () => {
    // The window doesn't scroll under the fixed-frame architecture — the
    // inner Lenis-managed container does.
    if (lenis) lenis.scrollTo(0);
    else
      document
        .getElementById("scroll-container")
        ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section id="contact" className="relative bg-bg">
      {/* Heading */}
      <div className="relative px-6 md:px-12 pt-20 md:pt-32 pb-12 md:pb-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-20%" }}
          custom={0}
          className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted"
        >
          // 06 ── say hi
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, letterSpacing: "0.4em", y: 20 }}
          whileInView={{ opacity: 1, letterSpacing: "-0.04em", y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{
            duration: 1.1,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.05,
          }}
          className="mt-8 text-[clamp(2.5rem,9vw,7.5rem)] font-medium leading-[0.95]"
        >
          Your move<span className="text-accent">.</span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15%" }}
          custom={0.4}
          className="mt-6 max-w-2xl text-fg-soft text-base md:text-lg leading-relaxed"
        >
          You've seen the work. Best way in:{" "}
          <span className="text-fg">email</span>. I read
          everything. I reply to most of it.
        </motion.p>
      </div>

      {/* Email CTA. the big one */}
      <div className="px-6 md:px-12 pb-4 md:pb-6">
        <Magnetic inline={false} strength={0.12} radius={260}>
        <motion.a
          href={`mailto:${EMAIL}`}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -3 }}
          className="group relative block rounded-xl border border-line bg-bg-soft/40 p-6 md:p-10 transition-colors duration-300 hover:border-accent/50 hover:bg-bg-soft/70"
          data-cursor="hover"
        >
          {/* corner LED */}
          <motion.span
            animate={{ opacity: [0.4, 0.95, 0.4] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-accent"
            aria-hidden
          />

          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-3">
                // primary channel
              </div>
              <div className="text-[clamp(1.5rem,5.5vw,4.5rem)] font-medium tracking-[-0.025em] leading-[1.05] break-all md:break-normal">
                <span className="text-fg">workaddressjosh</span>
                <span className="text-muted">@</span>
                <span className="text-fg-soft">gmail.com</span>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                <span>opened &lt; 4h</span>
                <span className="text-line">·</span>
                <span>replied &lt; 24h</span>
                <span className="text-line">·</span>
                <span>i do sleep though</span>
                <span className="text-line">·</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors ${
                    copied
                      ? "border-accent text-accent"
                      : "border-line text-fg-soft hover:border-accent/60 hover:text-accent"
                  }`}
                  data-cursor="hover"
                  aria-label="copy email"
                >
                  <span className="text-[9px]">
                    {copied ? "✓" : "⧉"}
                  </span>
                  {copied ? "copied" : "copy"}
                </button>
              </div>
            </div>

            <div
              className="hidden md:flex h-16 w-16 flex-none items-center justify-center rounded-full border border-line text-fg-soft transition-colors duration-300 group-hover:border-accent group-hover:text-accent"
              aria-hidden
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
              >
                <path
                  d="M5 15L15 5M15 5H7M15 5V13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="square"
                />
              </svg>
            </div>
          </div>
        </motion.a>
        </Magnetic>
      </div>

      {/* Social grid */}
      <div className="px-6 md:px-12 pb-4 md:pb-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.08, delayChildren: 0.1 },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {socials.map((s) => (
            <motion.a
              key={s.platform}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              whileHover={{ y: -2 }}
              className="group relative block rounded-lg border border-line bg-bg-soft/40 p-5 transition-colors duration-300 hover:border-accent/40 hover:bg-bg-soft/70"
              data-cursor="hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                    // {s.platform}
                  </div>
                  <div className="mt-2 text-lg md:text-xl font-medium text-fg">
                    {s.handle}
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] text-muted leading-snug">
                    <span className="text-line">// </span>
                    {s.label}
                  </div>
                </div>
                <div className="flex-none text-fg-soft group-hover:text-accent transition-colors duration-300">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  >
                    <path
                      d="M3 11L11 3M11 3H5M11 3V9"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="square"
                    />
                  </svg>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>

      {/* Meta strip */}
      <div className="px-6 md:px-12 pb-16 md:pb-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.06, delayChildren: 0.1 },
            },
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {meta.map((m) => (
            <motion.div
              key={m.label}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className="rounded-md border border-line bg-bg-soft/40 px-4 py-3"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                {m.label}
              </div>
              <div className="mt-1.5 text-sm text-fg">
                {m.value}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-line px-6 md:px-12 py-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          <div className="flex items-center gap-4">
            <span>© 2026 joshmann singh</span>
            <span className="hidden md:inline text-line">/</span>
            <span className="hidden md:inline">shipwithjosh.com</span>
          </div>
          <div className="flex items-center gap-4">
            <span>built in next.js. obviously.</span>
            <span className="text-line">/</span>
            <Magnetic strength={0.5} radius={80}>
              <button
                type="button"
                onClick={scrollToTop}
                className="text-fg-soft hover:text-accent transition-colors"
                data-cursor="hover"
              >
                back to top ↑
              </button>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
