"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterYoga() {
  return (
    <LifeChapter year="—" label="COMPETING">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block px-4 py-2 bg-fg text-bg font-mono text-sm md:text-base font-bold uppercase tracking-widest mb-8">
            STATE LEVEL
          </div>
          <p className="text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed">
            I became seriously involved in yoga. The pattern repeated itself.
          </p>
        </motion.div>
      </div>
    </LifeChapter>
  );
}
