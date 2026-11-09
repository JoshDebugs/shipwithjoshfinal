"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter08Moving() {
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
    <section ref={container} className="relative w-full h-[250vh] bg-[#080c11] text-[#93c5fd] ">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
        
        {/* Map visualization */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <svg viewBox="0 0 100 100" className="w-[80vw] h-[80vh] overflow-visible stroke-[#93c5fd] stroke-[0.5] fill-none">
            <motion.path 
              d="M 10,50 L 30,20 L 50,70 L 70,30 L 90,60" 
              initial={{ pathLength: 0 }}
              style={{ pathLength: useTransform(scrollYProgress, [0.2, 0.6], [0, 1]) }}
            />
            {[
              {x: 10, y: 50}, {x: 30, y: 20}, {x: 50, y: 70}, {x: 70, y: 30}, {x: 90, y: 60}
            ].map((pt, i) => (
              <motion.circle 
                key={i} cx={pt.x} cy={pt.y} r="2" fill="#93c5fd"
                style={{ opacity: useTransform(scrollYProgress, [0.2 + i*0.1, 0.3 + i*0.1], [0, 1]) }}
              />
            ))}
          </svg>
        </div>

        <motion.div 
          className="z-10 absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          <h2 className="text-2xl md:text-4xl font-mono uppercase tracking-widest text-white/50">
            Not every chapter<br/>was about winning.
          </h2>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 flex flex-col items-center justify-center gap-12 text-center"
          style={{ opacity: useTransform(scrollYProgress, [0.4, 0.5, 0.7, 0.8], [0, 1, 1, 0]) }}
        >
          <h2 className="text-6xl md:text-9xl font-extralight uppercase tracking-widest text-white">
            Home<br/>kept moving.
          </h2>
          <div className="flex gap-16 text-3xl font-mono uppercase tracking-widest text-[#93c5fd]">
            <span>5 Homes</span>
            <span>3 Years</span>
          </div>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 bg-[#080c11] flex items-center justify-center px-6"
          style={{ opacity: useTransform(scrollYProgress, [0.85, 0.95], [0, 1]) }}
        >
          <p className="text-xl md:text-2xl font-mono text-white/40 uppercase tracking-widest text-center">
            "Some years were just about adjusting."
          </p>
        </motion.div>

      </div>
    </section>
  );
}
