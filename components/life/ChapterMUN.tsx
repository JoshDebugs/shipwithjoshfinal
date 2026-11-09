"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterMUN() {
  return (
    <LifeChapter year="15" label="DEBATE" className="bg-[#e5e5e5] text-black">
      <div className="w-full flex flex-col md:flex-row items-center gap-16">
        
        <div className="w-full md:w-1/2">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-serif font-bold tracking-tight leading-none"
          >
            LEARNED TO ARGUE BEFORE I LEARNED TO CODE.
          </motion.h2>
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-8 relative">
          <motion.div 
            initial={{ opacity: 0, rotate: -2, x: 20 }}
            whileInView={{ opacity: 1, rotate: 0, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="bg-white p-8 md:p-12 shadow-2xl border border-neutral-300 flex flex-col gap-6 font-mono text-sm"
          >
            <div className="flex justify-between border-b-2 border-black pb-4 mb-4">
              <span className="font-bold tracking-widest">OFFICIAL RECORD</span>
              <span>CONFIDENTIAL</span>
            </div>
            
            <p className="leading-relaxed">
              DELEGATE STATUS: <span className="bg-black text-white px-2 py-1 font-bold">2ND BEST DELEGATE</span><br/><br/>
              ATTENDANCE: MULTIPLE CONFERENCES<br/><br/>
              NOTES: <span className="bg-black text-black select-none">Demonstrated high adaptability.</span> Argued complex geopolitical positions. <span className="bg-black text-black select-none">REDACTED.</span> Found a way to win arguments even when the initial position was weak.
            </p>
            
            <div className="mt-8 flex justify-end">
              <div className="border-t border-black pt-2 text-xs">AUTHORIZED SIGNATURE</div>
            </div>
          </motion.div>
        </div>

      </div>
    </LifeChapter>
  );
}
