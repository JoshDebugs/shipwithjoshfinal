"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterJEE() {
  return (
    <LifeChapter year="18" label="FAILURE" className="bg-bg">
      <div className="w-full flex flex-col items-center justify-center min-h-[70vh] gap-16 text-center">
        
        <motion.h2 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-5xl md:text-8xl font-bold tracking-tighter line-through decoration-fg-soft/50 decoration-8"
        >
          THIS ONE DIDN'T WORK.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 w-full max-w-3xl border-y border-line/30 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-2"
          >
            <span className="text-3xl font-mono font-bold">~2 YEARS</span>
            <span className="font-mono text-sm tracking-widest text-fg-soft">OF PREPARATION</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-2"
          >
            <span className="text-3xl font-mono font-bold text-fg-soft">IIT</span>
            <span className="font-mono text-sm tracking-widest text-accent">NOT HAPPENING</span>
          </motion.div>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 2 }}
          className="text-xl md:text-2xl text-fg-soft max-w-md leading-relaxed mt-12"
        >
          Some plans end.<br/>
          <span className="text-fg">The person doesn't.</span>
        </motion.p>

      </div>
    </LifeChapter>
  );
}
