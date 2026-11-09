"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ReactNode } from "react";

interface LifeChapterProps {
  year: string;
  label: string;
  children: ReactNode;
  className?: string;
  theme?: "dark" | "light" | "accent";
}

export function LifeChapter({ year, label, children, className = "", theme = "dark" }: LifeChapterProps) {
  return (
    <section 
      className={`relative w-full min-h-screen py-32 flex flex-col items-center justify-center overflow-hidden ${className}`}
    >
      {/* Background Year Typography */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0"
      >
        <div className="text-[25vw] font-bold leading-none tracking-tighter text-fg/[0.03]">
          {year}
        </div>
      </div>

      {/* Sticky Label */}
      <div className="absolute top-12 left-6 md:left-12 font-mono text-xs uppercase tracking-[0.2em] text-fg-soft z-20">
        <span className="text-accent mr-2">■</span> {year} // {label}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1200px] px-6 md:px-12">
        {children}
      </div>
    </section>
  );
}
