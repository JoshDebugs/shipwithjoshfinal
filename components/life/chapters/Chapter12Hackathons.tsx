"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter12Hackathons() {
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
    <section ref={container} className="relative w-full h-[250vh] bg-[#0a0a0a] text-[#bef264] ">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center px-6">
        
        {/* Rapid Cuts */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          <div className="flex flex-wrap gap-8 justify-center text-4xl md:text-7xl font-black uppercase tracking-tighter opacity-30">
            <span>Wireframes</span><span>Code</span><span>Pitch</span><span>Idea</span><span>Prototype</span><span>Demo</span><span>Error</span><span>Fix</span>
          </div>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 flex flex-col items-center justify-center gap-12"
          style={{ opacity: useTransform(scrollYProgress, [0.4, 0.5, 0.7, 0.8], [0, 1, 1, 0]) }}
        >
          <div className="flex flex-col gap-4 text-center border-b border-[#bef264]/20 pb-8">
            <h3 className="text-3xl md:text-5xl font-bold uppercase text-white">Smart India Hackathon</h3>
          </div>
          <div className="flex flex-col gap-4 text-center border-b border-[#bef264]/20 pb-8">
            <h3 className="text-2xl md:text-4xl font-bold uppercase text-white">IIT Roorkee Productathon</h3>
            <span className="text-xl font-mono text-[#bef264]">~4th Position</span>
          </div>
          <div className="flex flex-col gap-4 text-center">
            <h3 className="text-2xl md:text-4xl font-bold uppercase text-white">Ashoka Univ Fashion Hackathon</h3>
            <span className="text-xl font-mono text-[#bef264]">2nd Position</span>
          </div>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 bg-[#0a0a0a] flex items-center justify-center text-center"
          style={{ opacity: useTransform(scrollYProgress, [0.8, 0.9], [0, 1]) }}
        >
          <h2 className="text-[5rem] md:text-[10rem] font-black uppercase tracking-tighter leading-none flex flex-col">
            <span className="text-white">Build.</span>
            <span className="text-white/80">Break.</span>
            <span className="text-white/60">Pitch.</span>
            <span className="text-[#bef264]">Repeat.</span>
          </h2>
        </motion.div>

      </div>
    </section>
  );
}
