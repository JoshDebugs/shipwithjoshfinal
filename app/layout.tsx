import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Cursor } from "@/components/Cursor";
import { AppFrame } from "@/components/AppFrame";
import { ConsoleSignature } from "@/components/ConsoleSignature";

import { IntroAnimation } from "@/components/IntroAnimation";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Joshmann Singh — Builder",
    template: "%s · shipwithjosh.com",
  },
  description:
    "Builder out of Chandigarh. Three startups shipped, two paying, one for sale. Currently shipping LazyBull — AI-simplified trading.",
  // Vercel sets VERCEL_PROJECT_PRODUCTION_URL to the production domain when
  // a custom domain is attached. Falls back to the *.vercel.app deployment URL.
  // When shipwithjosh.com is wired to Vercel, this auto-resolves to it.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://shipwithjosh.vercel.app",
  ),
  keywords: [
    "Joshmann Singh",
    "shipwithjosh",
    "founder",
    "builder",
    "Chandigarh",
    "Next.js",
    "AI",
    "LazyBull",
    "Frags n Flavs",
    "StarScale",
    "indie hacker",
  ],
  authors: [{ name: "Joshmann Singh" }],
  creator: "Joshmann Singh",
  openGraph: {
    title: "Joshmann Singh — Builder",
    description:
      "Builder out of Chandigarh. Three startups shipped. Currently shipping LazyBull.",
    url: "/",
    siteName: "shipwithjosh",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joshmann Singh — Builder",
    description:
      "Builder out of Chandigarh. Three startups shipped. Currently shipping LazyBull.",
    creator: "@JoshDebugs",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  /**
   * Parallel route slot. Populated by `app/@modal/...` route segments.
   * `app/@modal/default.tsx` returns null so this is empty by default;
   * `app/@modal/(.)work/[slug]/page.tsx` intercepts in-app navigation from
   * the home page to `/work/[slug]` and renders the cinematic modal instead
   * of unmounting the home view. Direct hits / refresh on `/work/[slug]`
   * still render the standalone case-study page (good for SEO + sharing).
   */
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {/*
         * Persistent app frame — locked to the viewport, draws the border,
         * clips overflow. Only the inner scroll-container scrolls; the frame
         * itself never moves. The intro animation's final squircle has the
         * exact same inset/border/radius so it hands off seamlessly.
         *
         * `overlay` is the @modal parallel-route slot — renders above the
         * scroll surface inside the frame.
         */}
        <AppFrame overlay={modal}>{children}</AppFrame>
        <Cursor />

        <ConsoleSignature />
        <Analytics />
        <IntroAnimation />
      </body>
    </html>
  );
}
