"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { LifeChapter } from "./LifeChapter";

export function ChapterAnchoring() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} className="relative w-full cursor-none overflow-hidden bg-black">
      <div 
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, transparent 0%, rgba(0,0,0,0.95) 100%)`
        }}
      />
      
      <LifeChapter year="11" label="SPEAKING" className="bg-transparent">
        <div className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center gap-12 relative z-0">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-7xl md:text-[10vw] font-bold tracking-tighter leading-none"
          >
            MIC ON.
          </motion.h2>

          <div className="flex gap-12 md:gap-24 font-mono text-sm md:text-xl uppercase tracking-widest text-fg-soft">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-2"
            >
              <span className="text-white font-bold">GRADE 6</span>
              <span>ANCHOR</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-2"
            >
              <span className="text-white font-bold">GRADE 7</span>
              <span>ANCHOR</span>
            </motion.div>
          </div>
          
          {/* Audio Waveform Simulation */}
          <div className="flex items-center justify-center gap-1 h-12 mt-12 opacity-50">
            {[...Array(20)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: ["20%", "100%", "20%"] }}
                transition={{ 
                  duration: 0.5 + Math.random() * 0.5, 
                  repeat: Infinity, 
                  delay: Math.random() 
                }}
                className="w-1 md:w-2 bg-white rounded-full"
              />
            ))}
          </div>
        </div>
      </LifeChapter>
    </div>
  );
}
