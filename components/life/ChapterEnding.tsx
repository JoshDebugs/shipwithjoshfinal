"use client";

import { motion } from "framer-motion";

export function ChapterEnding() {
  return (
    <section className="relative w-screen min-h-[150vh] flex flex-col items-center justify-center bg-bg">
      <div className="flex flex-col items-center justify-center gap-12 text-center max-w-4xl px-6">
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1 }}
          className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase text-fg-soft"
        >
          SO WHAT'S THE PATTERN?
        </motion.p>

        <div className="flex flex-col gap-6 md:gap-8 mt-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-3xl md:text-5xl font-bold tracking-tighter uppercase"
          >
            I KEEP TRYING THINGS.
          </motion.h2>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1, delay: 1.5 }}
            className="text-3xl md:text-5xl font-bold tracking-tighter uppercase text-fg-soft"
          >
            SOME STUCK.
          </motion.h2>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1, delay: 2.5 }}
            className="text-3xl md:text-5xl font-bold tracking-tighter uppercase text-fg-soft"
          >
            SOME DIDN'T.
          </motion.h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1.5, delay: 4.0 }}
          className="mt-24 flex flex-col gap-8"
        >
          <p className="text-xl md:text-2xl text-fg max-w-2xl leading-relaxed">
            I'M STILL FIGURING OUT WHAT DESERVES THE NEXT FIVE YEARS.
          </p>
          <p className="text-xl md:text-2xl text-accent font-bold max-w-2xl leading-relaxed">
            STILL BUILDING.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
