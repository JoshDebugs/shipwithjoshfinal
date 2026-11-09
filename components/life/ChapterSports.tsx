"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterSports() {
  return (
    <LifeChapter year="14" label="COMPETING">
      <div className="w-full flex flex-col gap-12 md:gap-24 items-start">
        <motion.h2 
          initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-bold tracking-tighter"
        >
          I TRIED TO<br />GO PRO.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-4 border-l-2 border-accent pl-6"
          >
            <h3 className="text-3xl md:text-4xl font-bold">ROLLER SKATING</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">STATE LEVEL</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-4 border-l-2 border-accent pl-6"
          >
            <h3 className="text-3xl md:text-4xl font-bold">YOGA</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">STATE LEVEL</p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="w-full mt-12"
        >
          <div className="inline-block px-6 py-4 bg-fg text-bg font-mono text-sm md:text-base font-bold uppercase tracking-widest">
            20–25 MEDALS
          </div>
          <p className="mt-8 text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed">
            I tried to go pro. I reached state level. I won medals. Then life moved in another direction.
          </p>
        </motion.div>
      </div>
    </LifeChapter>
  );
}
