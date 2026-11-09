"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { LifeChapter } from "./LifeChapter";

export function ChapterRubiks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [0, 720]);
  
  const [mouseRot, setMouseRot] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / 10;
      const y = -(e.clientY - rect.top - rect.height / 2) / 10;
      setMouseRot({ x: y, y: x });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <LifeChapter year="14" label="OBSESSION" className="bg-bg">
      <div ref={containerRef} className="w-full flex flex-col md:flex-row items-center gap-16 min-h-[60vh] perspective-1000">
        
        <div className="w-full md:w-1/2 flex flex-col gap-6 z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight"
          >
            14 YEARS OLD.<br/>
            7+ CUBES.<br/>
            WAY TOO MUCH TIME.
          </motion.h2>
        </div>

        <div className="w-full md:w-1/2 flex justify-center items-center h-full relative" style={{ perspective: "1000px" }}>
          <motion.div 
            style={{ 
              rotateX: rotateX, 
              rotateY: rotateY,
              transformStyle: "preserve-3d"
            }}
            animate={{ 
              rotateX: mouseRot.x,
              rotateY: mouseRot.y
            }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            className="w-48 h-48 md:w-64 md:h-64 relative"
          >
            {/* Front */}
            <div className="absolute inset-0 border-2 border-accent bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform translate-z-[96px] md:translate-z-[128px]">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-accent/20 border border-accent/50" />)}
            </div>
            {/* Back */}
            <div className="absolute inset-0 border-2 border-line bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform -translate-z-[96px] md:-translate-z-[128px] rotate-y-180">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 border border-line" />)}
            </div>
            {/* Right */}
            <div className="absolute inset-0 border-2 border-line bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform translate-x-[96px] md:translate-x-[128px] rotate-y-90">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 border border-line" />)}
            </div>
            {/* Left */}
            <div className="absolute inset-0 border-2 border-line bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform -translate-x-[96px] md:-translate-x-[128px] -rotate-y-90">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 border border-line" />)}
            </div>
            {/* Top */}
            <div className="absolute inset-0 border-2 border-line bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform -translate-y-[96px] md:-translate-y-[128px] rotate-x-90">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 border border-line" />)}
            </div>
            {/* Bottom */}
            <div className="absolute inset-0 border-2 border-line bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform translate-y-[96px] md:translate-y-[128px] -rotate-x-90">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 border border-line" />)}
            </div>
          </motion.div>
        </div>

      </div>
    </LifeChapter>
  );
}
