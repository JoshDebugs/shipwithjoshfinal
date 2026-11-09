"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter06MUN() {
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
  const yDoc = useTransform(scrollYProgress, [0, 1], ["50%", "-50%"]);

  return (
    <section ref={container} className="relative w-full h-[250vh] bg-[#111] text-[#e0e0e0] ">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        
        {/* Document Background */}
        <motion.div 
          className="absolute w-[90vw] md:w-[60vw] h-[150vh] bg-[#f4f4f0] text-black p-12 flex flex-col gap-8 opacity-10 rotate-[-2deg]"
          style={{ y: yDoc }}
        >
          <div className="w-full border-b-2 border-black pb-4 text-xs font-mono uppercase flex justify-between">
            <span>Model United Nations</span>
            <span>Document 001</span>
          </div>
          <h1 className="text-6xl font-serif font-bold">RESOLUTION</h1>
          <div className="flex flex-col gap-4 font-serif text-lg leading-relaxed">
            <p>POINT</p><p>COUNTERPOINT</p><p>MOTION</p><p>REBUTTAL</p><p>SPEAKER</p>
          </div>
        </motion.div>

        <motion.div 
          className="z-10 flex flex-col items-center text-center gap-12"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          <h2 className="text-5xl md:text-8xl font-serif italic tracking-tight">
            I learned to argue<br/>before I learned to code.
          </h2>
          <div className="flex flex-col items-center mt-12 p-8 border border-white/20 bg-black/50 backdrop-blur-md">
            <span className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-[#ff5555]">2nd Best Delegate</span>
            <span className="mt-4 font-mono text-sm tracking-widest uppercase text-white/50">Across multiple conferences</span>
          </div>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 bg-[#111] flex items-center justify-center"
          style={{ opacity: useTransform(scrollYProgress, [0.85, 0.95], [0, 1]) }}
        >
          <h2 className="text-2xl font-mono uppercase tracking-[0.5em] text-white/30">Next.</h2>
        </motion.div>

      </div>
    </section>
  );
}
