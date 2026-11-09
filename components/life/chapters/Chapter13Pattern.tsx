"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter13Pattern() {
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
    <section ref={container} className="relative w-full h-[400vh] bg-black text-white ">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center text-center px-6">
        
        <motion.div style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div>
          <p className="text-sm font-mono tracking-[0.5em] uppercase text-white/50">So what's the pattern?</p>
        </motion.div>

        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: useTransform(scrollYProgress, [0.2, 0.3, 0.4, 0.5], [0, 1, 1, 0]) }}
        >
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter">I keep trying things.</h2>
        </motion.div>

        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-3xl md:text-5xl font-black uppercase tracking-widest text-white/30"
          style={{ opacity: useTransform(scrollYProgress, [0.5, 0.6, 0.7, 0.8], [0, 1, 1, 0]) }}
        >
          <span>Sports.</span><span>Content.</span><span>Gaming.</span><span>Speaking.</span><span>Building.</span><span>Business.</span><span>Technology.</span><span>Fitness.</span><span>Academics.</span>
        </motion.div>

        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center gap-12"
          style={{ opacity: useTransform(scrollYProgress, [0.8, 0.85, 0.9, 0.95], [0, 1, 1, 0]) }}
        >
          <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter">Some stuck.</h2>
          <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter text-white/40">Some didn't.</h2>
        </motion.div>

        <motion.div 
          className="absolute inset-0 bg-black flex items-center justify-center"
          style={{ opacity: useTransform(scrollYProgress, [0.95, 1], [0, 1]) }}
        >
          <h2 className="text-5xl md:text-9xl font-black uppercase tracking-tighter leading-none text-white">
            I keep finding<br/><span className="text-accent">the next thing.</span>
          </h2>
        </motion.div>

      </div>
    </section>
  );
}
