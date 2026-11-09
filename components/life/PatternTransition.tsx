"use client";

import { motion } from "framer-motion";

export function PatternTransition() {
  return (
    <section className="relative w-full min-h-[150vh] flex flex-col items-center justify-center bg-black text-white px-6">
      
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-20%" }}
        className="font-mono text-sm tracking-[0.3em] uppercase text-white/50 mb-32 text-center"
      >
        SO WHAT'S THE PATTERN?
      </motion.div>

      <motion.h2 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-20%" }}
        transition={{ duration: 1 }}
        className="text-6xl md:text-[10vw] font-bold tracking-tighter text-center leading-none"
      >
        I KEEP<br/>TRYING<br/>THINGS.
      </motion.h2>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-20%" }}
        transition={{ delay: 0.5, duration: 1 }}
        className="mt-32 font-mono text-lg md:text-2xl text-center text-white/40 leading-loose uppercase tracking-widest flex flex-col gap-2"
      >
        {["Sports.", "Content.", "Gaming.", "Speaking.", "Academics.", "Building.", "Business.", "Design.", "Technology."].map((word, i) => (
          <span key={word} className="hover:text-white transition-colors">{word}</span>
        ))}
      </motion.div>

      <div className="h-[40vh]" />

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-20%" }}
        className="text-2xl md:text-4xl font-medium tracking-tight text-center"
      >
        I don't think I'm good at just one thing yet.
      </motion.p>

      <div className="h-[20vh]" />

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-20%" }}
        transition={{ delay: 1, duration: 2 }}
        className="text-2xl md:text-4xl font-bold tracking-tight text-accent text-center"
      >
        Maybe that's the point.
      </motion.p>

    </section>
  );
}
