"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter09Startups() {
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

  return (
    <section ref={container} className="relative w-full h-[300vh] bg-[#050a05] text-[#86efac] overflow-hidden font-mono">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center px-6">
        
        {/* Grid Background */}
        <div className="absolute inset-0 border border-[#86efac]/10 bg-[linear-gradient(rgba(134,239,172,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(134,239,172,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

        <motion.div 
          className="z-10 absolute inset-0 flex items-center justify-center text-center bg-[#050a05]/80"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter">
            Then I started<br/>building.
          </h2>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 flex items-center justify-center"
          style={{ opacity: useTransform(scrollYProgress, [0.3, 0.4, 0.7, 0.8], [0, 1, 1, 0]) }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
            {[1, 2, 3].map((num) => (
              <div key={num} className="border border-[#86efac]/30 bg-black/50 p-6 flex flex-col gap-8 hover:bg-[#86efac]/10 transition-colors">
                <div className="text-xs uppercase tracking-widest text-[#86efac]/50 border-b border-[#86efac]/20 pb-4">
                  STARTUP 0{num}
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-white/50">FIELD:</span>
                  <span className="text-xl font-bold text-white uppercase">Software</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-white/50">WHAT I BUILT:</span>
                  <span className="text-lg text-white">Full-stack Product</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 bg-[#050a05] flex items-center justify-center text-center"
          style={{ opacity: useTransform(scrollYProgress, [0.8, 0.9], [0, 1]) }}
        >
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white">
            I made money<br/><span className="text-[#86efac]">from each.</span>
          </h2>
        </motion.div>

      </div>
    </section>
  );
}
