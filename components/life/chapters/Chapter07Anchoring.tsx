"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter07Anchoring() {
  const container = useRef<HTMLDivElement>(null);
  const scrollYProgress = useMotionValue(0);

  useLenis(() => {
    if (!container.current) return;
    const rect = container.current.getBoundingClientRect();
    const scrollDistance = rect.height - window.innerHeight;
    if (scrollDistance > 0) {
      const progress = Math.max(0, Math.min(1, -rect.top / scrollDistance));
      scrollYProgress.set(progress);
    }
  });
  
  const lightWidth = useTransform(scrollYProgress, [0.1, 0.4, 0.7, 0.9], ["0px", "600px", "600px", "0px"]);

  return (
    <section ref={container} className="relative w-full h-[250vh] bg-black text-white ">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
        
        {/* Spotlight */}
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 h-screen bg-gradient-to-b from-[#fff5d1]/20 to-transparent blur-3xl pointer-events-none"
          style={{ width: lightWidth }}
        />

        <motion.div 
          className="z-10 flex flex-col items-center gap-32 text-center"
        >
          <motion.div style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div>
            <h3 className="font-mono text-xl uppercase tracking-widest text-white/50">Grade 6</h3>
            <h2 className="text-6xl font-black uppercase mt-4 text-[#fff5d1]">Mic On.</h2>
          </motion.div>
          
          <motion.div style={{ opacity: useTransform(scrollYProgress, [0.3, 0.4, 0.5, 0.6], [0, 1, 1, 0]) }}>
            <h3 className="font-mono text-xl uppercase tracking-widest text-white/50">Grade 7</h3>
            <h2 className="text-6xl font-black uppercase mt-4 text-[#fff5d1]">Mic On.</h2>
          </motion.div>

          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            style={{ opacity: useTransform(scrollYProgress, [0.6, 0.7, 0.9, 1], [0, 1, 1, 0]) }}
          >
            <h2 className="text-4xl md:text-7xl font-bold uppercase tracking-tighter leading-tight max-w-4xl px-6 text-center text-[#fff5d1]">
              Anchored one of the biggest events in my school.
            </h2>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
