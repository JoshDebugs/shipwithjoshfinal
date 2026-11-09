"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useLenis } from "lenis/react";

export function LifeNav() {
  const [progress, setProgress] = useState(0);

  useLenis((lenis) => {
    setProgress(lenis.progress);
  });

  // Rough estimation of chapters based on scroll progress
  const totalChapters = 12;
  const currentChapter = Math.max(1, Math.min(totalChapters, Math.ceil(progress * totalChapters)));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 1 }}
      className="fixed bottom-6 left-6 md:left-auto md:right-6 z-50 flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-fg-soft"
    >
      <div className="hidden md:flex gap-4 items-center bg-bg-soft/80 backdrop-blur-md px-4 py-2 rounded-full border border-line">
        <Link href="/" className="hover:text-fg transition-colors">BACK TO HOME</Link>
        <span className="text-line">/</span>
        <Link href="/now" className="hover:text-fg transition-colors">NOW</Link>
        <span className="text-line">/</span>
        <Link href="/#contact" className="hover:text-fg transition-colors">CONTACT</Link>
      </div>

      <div className="bg-bg-soft/80 backdrop-blur-md px-4 py-2 rounded-full border border-line flex items-center gap-3">
        <span className="text-fg font-bold">LIFE LOG</span>
        <span className="text-accent">{currentChapter.toString().padStart(2, '0')} / {totalChapters}</span>
        
        {/* Progress circle */}
        <div className="w-4 h-4 relative">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-line" />
            <motion.circle 
              cx="50" cy="50" r="40" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="10" 
              className="text-accent"
              strokeDasharray="251.2"
              style={{ strokeDashoffset: 251.2 - (251.2 * progress) }}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
