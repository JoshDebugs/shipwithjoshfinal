"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter11JEE() {
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
    <section ref={container} className="relative w-full h-[300vh] bg-black text-white ">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
        
        {/* Chaos Grid */}
        <motion.div 
          className="absolute inset-0 flex flex-wrap opacity-20 pointer-events-none"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          {[...Array(200)].map((_, i) => (
            <div key={i} className="text-[8px] font-mono p-1 ">
              ∫e^x dx = e^x + C • F = ma • E = mc² • {Math.random().toFixed(4)}
            </div>
          ))}
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 bg-black flex flex-col items-center justify-center text-center"
          style={{ opacity: useTransform(scrollYProgress, [0.5, 0.6, 0.7, 0.8], [0, 1, 1, 0]) }}
        >
          <h2 className="text-[8rem] md:text-[15rem] font-black uppercase tracking-tighter leading-none text-[#ff3333]">2 Years.</h2>
          <h3 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mt-4">JEE.</h3>
          <h2 className="text-4xl md:text-7xl font-bold uppercase mt-12 text-white/50">IIT didn't happen.</h2>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 bg-black flex flex-col items-center justify-center gap-8 text-center"
          style={{ opacity: useTransform(scrollYProgress, [0.85, 0.95], [0, 1]) }}
        >
          <h3 className="text-3xl md:text-5xl font-mono uppercase tracking-widest text-white/60 leading-relaxed">
            I studied.<br/>I tried.<br/>It didn't work.
          </h3>
          <h2 className="mt-16 text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
            And I kept going.
          </h2>
        </motion.div>

      </div>
    </section>
  );
}
