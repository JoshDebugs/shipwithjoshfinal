import type { Metadata } from "next";
import Link from "next/link";
import { RoadmapClient } from "@/components/RoadmapClient";

export const metadata: Metadata = {
  title: "Roadmap · shipwithjosh.com",
  description: "The 2030 Quant/AI engineering master study plan.",
};

export default function RoadmapPage() {
  return (
    <main className="relative bg-bg w-full flex flex-col overflow-hidden h-[calc(100dvh-16px)] md:h-[calc(100dvh-20px)]">
      {/* Top chrome */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 pt-6 md:pt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-soft pointer-events-none">
        <Link
          href="/now"
          className="pointer-events-auto group flex items-center gap-2 hover:text-accent transition-colors"
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
          back to now
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <span>master plan · 2030 stack</span>
        </div>
      </header>

      {/* Mindmap Container */}
      <div className="flex-1 w-full h-full relative">
        <RoadmapClient />
      </div>
    </main>
  );
}
