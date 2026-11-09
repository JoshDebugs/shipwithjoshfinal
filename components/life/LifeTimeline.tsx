"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useLenis } from "lenis/react";

const TIMELINE = [
  "2007",
  "2010",
  "2012",
  "2015",
  "2017",
  "2018 & '19",
  "COVID ERA",
  "2022",
  "2024",
  "2026"
];

export function LifeTimeline() {
  const [progress, setProgress] = useState(0);

  useLenis((lenis) => {
    setProgress(lenis.progress);
  });

  // Map progress (0-1) to the active index
  const activeIndex = Math.min(
    TIMELINE.length - 1,
    Math.max(0, Math.floor(progress * TIMELINE.length))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, duration: 1 }}
      className="fixed left-4 md:left-12 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col items-start font-mono text-[10px] tracking-widest pointer-events-none"
    >
      <div className="relative flex flex-col justify-between py-12 h-[60vh] border-l border-line/50 pl-6">
        {/* Active progress line over the border */}
        <motion.div 
          className="absolute top-0 left-[-1px] w-[2px] bg-accent"
          style={{ height: `${progress * 100}%` }}
        />

        {TIMELINE.map((item, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;

          return (
            <div key={item} className="relative flex items-center h-full">
              {/* Dot */}
              <div 
                className={`absolute -left-[27px] w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isActive ? "bg-accent scale-150 shadow-[0_0_8px_rgba(0,230,118,0.8)]" : 
                  isPast ? "bg-fg-soft" : "bg-line"
                }`}
              />
              
              {/* Label */}
              <div 
                className={`transition-all duration-300 ${
                  isActive ? "text-accent font-bold scale-110 origin-left" : 
                  isPast ? "text-fg-soft/70" : "text-fg-soft/30"
                }`}
              >
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
