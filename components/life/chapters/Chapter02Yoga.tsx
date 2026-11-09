"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter02Yoga() {
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
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 1.2]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={container} className="relative w-full h-[200vh] bg-[#02080a] text-[#a0e8f0] ">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
        
        {/* Breathing Circle */}
        <motion.div 
          className="absolute w-[40vw] h-[40vw] md:w-[20vw] md:h-[20vw] rounded-full border-[1px] border-[#a0e8f0]/20 flex items-center justify-center"
          style={{ scale, opacity }}
        >
          <motion.div 
            className="w-full h-full rounded-full bg-gradient-radial from-[#a0e8f0]/10 to-transparent"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        <motion.div 
          className="z-10 flex flex-col items-center text-center gap-16"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          <div>
            <p className="text-sm font-mono tracking-[0.3em] uppercase text-[#a0e8f0]/50 mb-4">The next obsession</p>
            <h2 className="text-6xl md:text-9xl font-extralight tracking-widest uppercase">Yoga</h2>
          </div>

          <div className="flex flex-col gap-4 items-center mt-12">
            <h3 className="text-2xl md:text-4xl font-light uppercase tracking-widest">State Level</h3>
            <div className="flex flex-col items-center">
              <span className="text-5xl md:text-7xl font-extralight">20–25</span>
              <span className="text-sm font-mono tracking-widest uppercase text-[#a0e8f0]/50 mt-2">Medals (Total combined)</span>
            </div>
          </div>
          
          <p className="text-lg md:text-xl font-light text-[#a0e8f0]/70 max-w-md mt-12">
            I found another sport to obsess over.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
