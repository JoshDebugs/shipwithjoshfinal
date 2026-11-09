"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter04Minecraft() {
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
    <section ref={container} className="relative w-full h-[250vh] bg-[#0a0a0a] text-[#4ade80] overflow-hidden" style={{ imageRendering: "pixelated" }}>
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center px-6">
        
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(74,222,128,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(74,222,128,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center gap-6"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          <h2 className="text-4xl font-mono uppercase tracking-widest text-white/50">I got obsessed.</h2>
          <div className="flex gap-8 text-6xl md:text-9xl font-black uppercase tracking-tighter">
            <span>Bedwars</span>
            <span className="text-white/20">+</span>
            <span>Skywars</span>
          </div>
        </motion.div>

        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center gap-12"
          style={{ opacity: useTransform(scrollYProgress, [0.4, 0.5, 0.7, 0.8], [0, 1, 1, 0]) }}
        >
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-widest text-white">Montages</h2>
          <div className="w-full max-w-2xl h-[4px] bg-[#333] relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-[#4ade80]"
              style={{ width: useTransform(scrollYProgress, [0.4, 0.7], ["0%", "100%"]) }}
            />
            <div className="absolute top-4 left-0 text-xs font-mono text-white/50">00:00</div>
            <div className="absolute top-4 right-0 text-xs font-mono text-white/50">03:42</div>
          </div>
          <div className="mt-8 flex flex-col items-center">
            <span className="text-6xl md:text-8xl font-black">~400</span>
            <span className="font-mono uppercase tracking-widest text-white">Subscribers</span>
          </div>
        </motion.div>

        <motion.div 
          className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center gap-8 text-center"
          style={{ opacity: useTransform(scrollYProgress, [0.8, 0.9], [0, 1]) }}
        >
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter">
            Almost went<br/>competitive.
          </h2>
          <p className="mt-12 text-sm font-mono text-white/40 uppercase tracking-widest">Then I found another rabbit hole.</p>
        </motion.div>

      </div>
    </section>
  );
}
