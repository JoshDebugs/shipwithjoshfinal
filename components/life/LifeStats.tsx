"use client";

import { motion } from "framer-motion";

const STATS = [
  { value: "18", label: "YEARS ALIVE", color: "text-[#FFEB3B]" },
  { value: "20+", label: "MEDALS", color: "text-[#00E5FF]" },
  { value: "10M+", label: "VIEWS", color: "text-[#FF4081]" },
  { value: "2K+", label: "FOLLOWERS", color: "text-[#7C4DFF]" },
  { value: "400+", label: "MC SUBSCRIBERS", color: "text-[#00E676]" },
  { value: "7+", label: "RUBIK'S CUBES", color: "text-[#FF9100]" },
  { value: "3", label: "STARTUPS BUILT", color: "text-[#FF5252]" },
  { value: "MULTIPLE", label: "HACKATHONS", color: "text-white" },
];

export function LifeStats() {
  return (
    <section className="relative w-full py-32 md:py-48 px-6 md:px-12 bg-bg flex flex-col items-center">
      <div className="max-w-[1200px] w-full grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-24 md:gap-y-32">
        {STATS.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4 items-start"
          >
            <span className={`text-5xl md:text-7xl font-bold tracking-tighter ${stat.color}`}>
              {stat.value}
            </span>
            <span className="font-mono text-xs text-fg-soft uppercase tracking-widest border-t border-line/50 pt-4 w-full">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
