"use client";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRef } from "react";

export function Chapter03SocialMedia() {
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
  
  const yFeed1 = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);
  const yFeed2 = useTransform(scrollYProgress, [0, 1], ["-50%", "50%"]);
  const yFeed3 = useTransform(scrollYProgress, [0, 1], ["20%", "-150%"]);

  return (
    <section ref={container} className="relative w-full h-[300vh] bg-black text-[#ff00ff] ">
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
        
        {/* Infinite Feed Background */}
        <div className="absolute inset-0 flex justify-center gap-4 opacity-20 rotate-[-5deg] scale-125 pointer-events-none">
          <motion.div style={{ y: yFeed1 }} className="w-1/4 md:w-1/5 flex flex-col gap-4">
            {[...Array(15)].map((_, i) => <div key={i} className="w-full aspect-[4/5] bg-[#ff00ff]/20 rounded-md" />)}
          </motion.div>
          <motion.div style={{ y: yFeed2 }} className="w-1/4 md:w-1/5 flex flex-col gap-4">
            {[...Array(15)].map((_, i) => <div key={i} className="w-full aspect-square bg-[#ff00ff]/30 rounded-md" />)}
          </motion.div>
          <motion.div style={{ y: yFeed3 }} className="w-1/4 md:w-1/5 flex flex-col gap-4 hidden md:flex">
            {[...Array(15)].map((_, i) => <div key={i} className="w-full aspect-[4/5] bg-[#ff00ff]/10 rounded-md" />)}
          </motion.div>
        </div>

        {/* Content */}
        <motion.div 
          className="z-10 absolute inset-0 flex flex-col items-center justify-center gap-12 text-center"
          style={{ border: "5px solid red", opacity: 1 }}>
          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div
        >
          <p className="text-xl md:text-2xl font-mono text-white max-w-2xl px-6 leading-relaxed">
            "Before I knew much about marketing, I was already trying to get strangers on the internet to pay attention."
          </p>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 flex flex-col items-center justify-center gap-8 text-center"
          style={{ opacity: useTransform(scrollYProgress, [0.5, 0.6, 0.8, 0.9], [0, 1, 1, 0]) }}
        >
          <div className="flex flex-col md:flex-row gap-12 md:gap-32">
            <div className="flex flex-col items-center">
              <span className="text-7xl md:text-9xl font-black tracking-tighter">2K+</span>
              <span className="text-xl font-mono uppercase tracking-widest text-white">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-7xl md:text-9xl font-black tracking-tighter">2K+</span>
              <span className="text-xl font-mono uppercase tracking-widest text-white">Followers</span>
            </div>
          </div>
          <div className="mt-16 flex flex-col items-center">
            <span className="text-[6rem] md:text-[12rem] font-black tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(255,0,255,0.5)]">10M+</span>
            <span className="text-2xl font-mono uppercase tracking-[0.3em] text-[#ff00ff] mt-4">Views</span>
          </div>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 bg-black flex flex-col items-center justify-center text-center"
          style={{ opacity: useTransform(scrollYProgress, [0.9, 0.95], [0, 1]) }}
        >
          <h2 className="text-3xl md:text-5xl font-mono uppercase text-white/50 mb-8">I learned something:</h2>
          <h1 className="text-6xl md:text-[8rem] font-black uppercase tracking-tighter leading-none">
            Attention<br/>is a<br/>currency.
          </h1>
        </motion.div>

      </div>
    </section>
  );
}
