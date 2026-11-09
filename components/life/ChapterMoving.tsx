"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterMoving() {
  return (
    <LifeChapter year="15" label="ADJUSTING" className="bg-bg">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-16 min-h-[60vh]">
        
        <div className="w-full md:w-1/2 flex flex-col gap-12 z-10">
          <motion.h2 
            initial={{ opacity: 0, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="text-5xl md:text-8xl font-bold tracking-tighter text-fg-soft"
          >
            HOME<br/>MOVED.
          </motion.h2>

          <div className="flex flex-col gap-2 font-mono text-xl tracking-widest">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-fg font-bold"
            >
              5 HOMES
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 1 }}
              className="text-fg-soft"
            >
              3 YEARS
            </motion.span>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1, duration: 1.5 }}
            className="text-xl md:text-2xl text-fg-soft max-w-md leading-relaxed mt-8"
          >
            Some years weren't about winning anything.<br/>
            Some years were just about adjusting.
          </motion.p>
        </div>

        {/* Fragmented map visualization */}
        <div className="w-full md:w-1/2 h-full relative flex items-center justify-center opacity-50">
          <svg className="w-full max-w-md aspect-square" viewBox="0 0 100 100">
            <motion.path 
              d="M 10,90 L 30,60 L 20,40 L 60,30 L 80,10" 
              fill="none" 
              stroke="var(--color-line)" 
              strokeWidth="0.5"
              strokeDasharray="2 2"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
            {[
              { cx: 10, cy: 90 },
              { cx: 30, cy: 60 },
              { cx: 20, cy: 40 },
              { cx: 60, cy: 30 },
              { cx: 80, cy: 10 },
            ].map((p, i) => (
              <motion.circle 
                key={i}
                cx={p.cx} 
                cy={p.cy} 
                r="1" 
                fill="var(--color-fg-soft)"
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.6 + 0.5 }}
              />
            ))}
          </svg>
        </div>

      </div>
    </LifeChapter>
  );
}
