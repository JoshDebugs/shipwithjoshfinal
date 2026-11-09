"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { LifeChapter } from "./LifeChapter";

export function ChapterFitness() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const o1 = useTransform(scrollYProgress, [0, 0.2], [0.2, 1]);
  const o2 = useTransform(scrollYProgress, [0.2, 0.4], [0.2, 1]);
  const o3 = useTransform(scrollYProgress, [0.4, 0.6], [0.2, 1]);
  const o4 = useTransform(scrollYProgress, [0.6, 0.8], [0.2, 1]);

  return (
    <LifeChapter year="18" label="TRAINING" className="bg-[#111]">
      <div ref={containerRef} className="w-full flex flex-col gap-24 items-center justify-center min-h-[80vh]">
        
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-mono tracking-tighter uppercase text-center"
        >
          BUILT THE BODY TOO.
        </motion.h2>

        <div className="flex flex-col gap-6 md:gap-12 items-center text-4xl md:text-8xl font-bold tracking-tighter uppercase">
          <motion.span style={{ opacity: o1 }}>DISCIPLINE</motion.span>
          <motion.span style={{ opacity: o2 }}>TRAINING</motion.span>
          <motion.span style={{ opacity: o3 }}>NUTRITION</motion.span>
          <motion.span style={{ opacity: o4 }} className="text-accent">CONSISTENCY</motion.span>
        </div>

      </div>
    </LifeChapter>
  );
}
