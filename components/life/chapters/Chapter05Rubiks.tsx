"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter05Rubiks() {
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
    <section ref={container} className="relative w-full h-[200vh] bg-black text-white ">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
        
        {/* Abstract 3D Cube Representation */}
        <motion.div 
          className="absolute w-[300px] h-[300px] border-4 border-white/20 flex flex-wrap"
          style={{ 
            rotateX: useTransform(scrollYProgress, [0, 1], [0, 360]),
            rotateY: useTransform(scrollYProgress, [0, 1], [0, 720]),
            rotateZ: useTransform(scrollYProgress, [0, 1], [0, 180])
          }}
        >
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-[33.33%] h-[33.33%] border border-white/20" />
          ))}
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 flex flex-col items-center justify-center gap-8 text-center bg-black/80 backdrop-blur-sm"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          <h3 className="font-mono text-2xl uppercase tracking-widest text-fg-soft">Age 14</h3>
          <h2 className="text-[6rem] md:text-[10rem] font-black leading-none text-[#ff3333]">7+</h2>
          <h3 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter">Different Cubes.</h3>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 flex flex-col items-center justify-center text-center bg-black"
          style={{ opacity: useTransform(scrollYProgress, [0.7, 0.8], [0, 1]) }}
        >
          <p className="text-xl md:text-3xl font-mono text-white/50 max-w-2xl leading-relaxed px-6">
            "I have a habit of going too deep into things."
          </p>
        </motion.div>

      </div>
    </section>
  );
}
