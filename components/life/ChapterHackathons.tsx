"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterHackathons() {
  return (
    <LifeChapter year="18" label="HACKATHONS" className="bg-[#f5f5f5] text-black overflow-visible">
      <div className="w-full flex flex-col items-center justify-center min-h-[80vh] relative z-10">
        
        <motion.h2 
          initial={{ opacity: 0, scale: 2 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="text-6xl md:text-[8vw] font-bold tracking-tighter leading-none text-center z-20 mix-blend-difference text-white"
        >
          BUILD.<br/>BREAK.<br/>PITCH.<br/>REPEAT.
        </motion.h2>

        {/* Floating Notes */}
        <motion.div 
          initial={{ opacity: 0, rotate: -10, x: -100, y: -50 }}
          whileInView={{ opacity: 1, rotate: -6, x: 0, y: 0 }}
          viewport={{ once: true }}
          className="absolute top-1/4 left-0 md:left-1/4 bg-[#FFEB3B] p-6 shadow-xl w-64 h-64 flex flex-col gap-4 font-mono z-10"
        >
          <span className="font-bold text-xl border-b-2 border-black/20 pb-2">IIT ROORKEE</span>
          <span className="text-sm">Productathon</span>
          <span className="text-4xl font-bold mt-auto">~4TH</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, rotate: 10, x: 100, y: 50 }}
          whileInView={{ opacity: 1, rotate: 4, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-1/4 right-0 md:right-1/4 bg-[#00E5FF] p-6 shadow-xl w-64 h-64 flex flex-col gap-4 font-mono z-10"
        >
          <span className="font-bold text-xl border-b-2 border-black/20 pb-2">ASHOKA UNIV.</span>
          <span className="text-sm">Fashion Design Hackathon</span>
          <span className="text-4xl font-bold mt-auto">2ND</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black text-white p-6 shadow-2xl flex flex-col gap-2 font-mono z-30"
        >
          <span className="font-bold text-xl">SMART INDIA HACKATHON</span>
          <span className="text-sm text-white/50 tracking-widest">PARTICIPATED</span>
        </motion.div>

      </div>
    </LifeChapter>
  );
}
