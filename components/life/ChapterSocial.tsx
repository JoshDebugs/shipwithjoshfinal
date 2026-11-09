"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { LifeChapter } from "./LifeChapter";

export function ChapterSocial() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <LifeChapter year="15" label="CONTENT" className="bg-[#111]">
      <div ref={containerRef} className="w-full flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:w-1/2 flex flex-col gap-8 z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold tracking-tighter"
          >
            Before I knew what a startup was, I was already trying to get strangers on the internet to pay attention.
          </motion.h2>
          
          <div className="flex gap-4 font-mono text-xs uppercase tracking-widest text-accent">
            <span>INSTAGRAM</span>
            <span>//</span>
            <span>CONTENT CREATION</span>
          </div>
        </div>

        <div className="w-full md:w-1/2 h-[600px] relative overflow-hidden rounded-xl border border-line bg-black/50 flex gap-4 p-4">
          {/* Simulated Infinite Feed Columns */}
          <motion.div style={{ y: y1 }} className="flex-1 flex flex-col gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full aspect-[4/5] bg-bg-soft rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </motion.div>
          
          <motion.div style={{ y: y2 }} className="flex-1 flex flex-col gap-4 mt-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full aspect-square bg-bg-soft rounded-lg flex items-center justify-center p-4 text-center">
                {i === 2 && <span className="font-bold text-xl">10M+<br/><span className="text-[10px] text-fg-soft font-mono">VIEWS</span></span>}
              </div>
            ))}
          </motion.div>

          <motion.div style={{ y: y3 }} className="flex-1 flex flex-col gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full aspect-[4/5] bg-bg-soft rounded-lg flex items-center justify-center p-4 text-center">
                {i === 1 && <span className="font-bold text-xl">2K+<br/><span className="text-[10px] text-fg-soft font-mono">FOLLOWERS</span></span>}
              </div>
            ))}
          </motion.div>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-[#111] pointer-events-none" />
        </div>
      </div>
    </LifeChapter>
  );
}
