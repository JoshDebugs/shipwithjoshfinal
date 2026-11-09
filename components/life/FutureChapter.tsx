"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function FutureChapter() {
  return (
    <section className="relative w-full py-48 px-6 md:px-12 bg-bg flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-32">
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex flex-col gap-4"
        >
          <h2 className="text-6xl md:text-9xl font-bold tracking-tighter">NEXT</h2>
          <span className="font-mono text-sm uppercase tracking-widest text-fg-soft animate-pulse">
            [ Still loading... ]
          </span>
        </motion.div>

        <div className="flex flex-col gap-8 font-mono text-lg md:text-2xl uppercase tracking-widest">
          {[
            "BUILD SOMETHING PEOPLE ACTUALLY USE",
            "BECOME TECHNICALLY DANGEROUS",
            "BUILD COMPANIES",
            "GET BETTER AT EVERYTHING THAT MATTERS",
            "CREATE WORK I'M PROUD OF"
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-6 items-start text-fg-soft hover:text-fg transition-colors group"
            >
              <span className="text-line group-hover:text-accent transition-colors">→</span>
              {item}
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-32 flex flex-col items-center text-center gap-12"
        >
          <div className="w-px h-24 bg-gradient-to-b from-line to-transparent" />
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-fg-soft">
            THE STORY ISN'T DONE.
          </p>
          <Link href="/" className="px-8 py-4 bg-fg text-bg font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform">
            BACK TO HOME
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
