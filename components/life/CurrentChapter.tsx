"use client";

import { motion } from "framer-motion";

export function CurrentChapter() {
  return (
    <section className="relative w-full py-48 px-6 md:px-12 bg-[#050505] flex flex-col items-center border-t border-line/10">
      <div className="w-full max-w-6xl flex flex-col items-center text-center gap-16">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex flex-col gap-4"
        >
          <h2 className="text-[20vw] md:text-[15vw] font-bold leading-none tracking-tighter text-fg">
            2026
          </h2>
          <span className="font-mono text-xl md:text-3xl uppercase tracking-[0.3em] text-accent">
            CURRENTLY
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-4xl"
        >
          {['CS + AI/ML', 'COLLEGE', 'STARTUPS', 'BUILDING', 'LEARNING', 'TRAINING'].map((tag) => (
            <div key={tag} className="px-6 py-3 md:px-8 md:py-4 border border-line/30 rounded-full text-lg md:text-2xl font-mono uppercase tracking-widest text-fg-soft hover:text-fg hover:border-fg transition-colors">
              {tag}
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
