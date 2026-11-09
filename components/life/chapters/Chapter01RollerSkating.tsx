"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter01RollerSkating() {
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
  const xLine = useTransform(scrollYProgress, [0, 0.2], ["-100vw", "100vw"]);
  const xText = useTransform(scrollYProgress, [0.1, 0.4], ["-50vw", "0vw"]);
  const wordsY = useTransform(scrollYProgress, [0.3, 0.6], [100, -100]);
  const wordsOpacity = useTransform(scrollYProgress, [0.3, 0.4, 0.5, 0.6], [0, 1, 1, 0]);

  return (
    <section ref={container} className="relative w-full h-[300vh] bg-[#050505] text-[#FFD700] ">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
        
        {/* Intro */}
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          <h2 className="text-8xl md:text-[12rem] font-bold tracking-tighter opacity-10">2015 — 2018</h2>
          <motion.div className="w-full h-[2px] bg-[#FFD700] absolute top-1/2" style={{ x: xLine }} />
        </motion.div>

        {/* Text */}
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ opacity: useTransform(scrollYProgress, [0.1, 0.2, 0.3], [0, 1, 0]), x: xText }}
        >
          <h2 className="text-4xl md:text-7xl font-bold tracking-tighter uppercase text-center max-w-4xl leading-none">
            I got obsessed with<br/>wheels on my feet.
          </h2>
          <h3 className="mt-8 text-2xl font-mono tracking-[0.3em] uppercase">Roller Skating</h3>
        </motion.div>

        {/* Rapid words */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: wordsOpacity, y: wordsY }}
        >
          <div className="flex flex-col gap-8 text-center text-5xl md:text-8xl font-black uppercase italic tracking-tighter opacity-20">
            <span>Try</span><span>Push</span><span>Fall</span><span>Get up</span><span>Repeat</span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center gap-12"
          style={{ 
            opacity: useTransform(scrollYProgress, [0.6, 0.7, 0.85, 0.95], [0, 1, 1, 0]),
            scale: useTransform(scrollYProgress, [0.6, 0.7], [0.5, 1])
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-7xl md:text-9xl font-black">12</span>
            <span className="text-xl md:text-2xl font-mono tracking-widest uppercase">Competitions</span>
          </div>
          
          <div className="flex flex-col items-center text-white">
            <span className="text-8xl md:text-[10rem] font-black leading-none">15</span>
            <span className="text-2xl font-mono tracking-widest uppercase text-[#FFD700]">Medals</span>
          </div>

          <div className="flex gap-8 font-mono text-lg md:text-xl text-white/70 uppercase text-center">
            <div className="flex flex-col"><span>04</span><span className="text-sm">Gold</span></div>
            <div className="flex flex-col"><span>08</span><span className="text-sm">Silver</span></div>
            <div className="flex flex-col"><span>03</span><span className="text-sm">Bronze</span></div>
          </div>
        </motion.div>

        {/* Conclusion */}
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-black"
          style={{ opacity: useTransform(scrollYProgress, [0.85, 0.9], [0, 1]) }}
        >
          <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter text-white">State Level</h2>
          <h3 className="text-3xl md:text-5xl font-bold uppercase text-[#FFD700]">State Silver</h3>
          
          <motion.div 
            className="mt-32 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.8 }}
          >
            <p className="text-xl md:text-2xl font-mono tracking-widest text-white/50 uppercase">
              I kept chasing<br/>the next thing.
            </p>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
