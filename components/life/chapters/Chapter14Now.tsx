"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter14Now() {
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
    <section ref={container} className="relative w-full h-[250vh] bg-white text-black ">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center px-6">
        
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center gap-16"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          <div className="flex gap-16 text-2xl font-mono uppercase tracking-widest text-black/40">
            <span>2026</span>
            <span>Age 18</span>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-mono tracking-widest uppercase text-black/50 mb-8">Currently:</h3>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase">CS + AI/ML</h2>
          </div>

          <div className="flex gap-8 text-xl font-mono uppercase tracking-widest text-black/60">
            <span>Building</span><span>Startups</span><span>Learning</span><span>Training</span><span>Shipping</span>
          </div>
        </motion.div>

        <motion.div 
          className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-8"
          style={{ opacity: useTransform(scrollYProgress, [0.8, 0.9], [0, 1]) }}
        >
          <h2 className="text-4xl md:text-7xl font-light uppercase tracking-widest text-black/40">Still figuring it out.</h2>
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-black">Still building.</h2>
        </motion.div>

      </div>
    </section>
  );
}
