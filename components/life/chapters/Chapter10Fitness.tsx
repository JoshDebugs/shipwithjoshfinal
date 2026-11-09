"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter10Fitness() {
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
    <section ref={container} className="relative w-full h-[250vh] bg-[#f5f5f5] text-black overflow-hidden font-mono">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
        
        <motion.div 
          className="z-10 absolute inset-0 flex flex-col items-center justify-center gap-4"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          <div className="flex flex-col text-6xl md:text-9xl font-black opacity-10 leading-none">
            <span>01</span><span>02</span><span>03</span><span>04</span><span>05</span><span>06</span>
          </div>
          <h2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8rem] md:text-[15rem] font-black uppercase tracking-tighter mix-blend-difference text-white">
            Repeat.
          </h2>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 flex flex-col items-center justify-center gap-12 bg-[#f5f5f5]"
          style={{ opacity: useTransform(scrollYProgress, [0.5, 0.6, 0.9, 1], [0, 1, 1, 0]) }}
        >
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter">Built the body too.</h2>
          <div className="flex gap-16 text-xl tracking-widest uppercase items-center text-black/60">
            <span>Age 18</span>
            <span>Muscular</span>
            <span>Lean</span>
            <span>Consistent</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
