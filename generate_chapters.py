import os

components_dir = "components/life/chapters"
os.makedirs(components_dir, exist_ok=True)

files = {}

files["Chapter01RollerSkating.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter01RollerSkating() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });
  const xLine = useTransform(scrollYProgress, [0, 0.2], ["-100vw", "100vw"]);
  const xText = useTransform(scrollYProgress, [0.1, 0.4], ["-50vw", "0vw"]);
  const wordsY = useTransform(scrollYProgress, [0.3, 0.6], [100, -100]);
  const wordsOpacity = useTransform(scrollYProgress, [0.3, 0.4, 0.5, 0.6], [0, 1, 1, 0]);

  return (
    <section ref={container} className="relative w-full h-[300vh] bg-[#050505] text-[#FFD700] overflow-hidden">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center">
        
        {/* Intro */}
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.1, 0.2], [1, 1, 0]) }}
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
"""

files["Chapter02Yoga.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter02Yoga() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 1.2]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={container} className="relative w-full h-[200vh] bg-[#02080a] text-[#a0e8f0] overflow-hidden">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center">
        
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
          style={{ opacity: useTransform(scrollYProgress, [0.1, 0.3, 0.7, 0.9], [0, 1, 1, 0]) }}
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
"""

files["Chapter03SocialMedia.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter03SocialMedia() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });
  
  const yFeed1 = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);
  const yFeed2 = useTransform(scrollYProgress, [0, 1], ["-50%", "50%"]);
  const yFeed3 = useTransform(scrollYProgress, [0, 1], ["20%", "-150%"]);

  return (
    <section ref={container} className="relative w-full h-[300vh] bg-black text-[#ff00ff] overflow-hidden">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center">
        
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
          style={{ opacity: useTransform(scrollYProgress, [0.1, 0.2, 0.4, 0.5], [0, 1, 1, 0]) }}
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
"""

files["Chapter04Minecraft.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter04Minecraft() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });
  
  return (
    <section ref={container} className="relative w-full h-[250vh] bg-[#0a0a0a] text-[#4ade80] overflow-hidden" style={{ imageRendering: "pixelated" }}>
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center px-6">
        
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(74,222,128,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(74,222,128,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center gap-6"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.2, 0.3, 0.4], [0, 1, 1, 0]) }}
        >
          <h2 className="text-4xl font-mono uppercase tracking-widest text-white/50">I got obsessed.</h2>
          <div className="flex gap-8 text-6xl md:text-9xl font-black uppercase tracking-tighter">
            <span>Bedwars</span>
            <span className="text-white/20">+</span>
            <span>Skywars</span>
          </div>
        </motion.div>

        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center gap-12"
          style={{ opacity: useTransform(scrollYProgress, [0.4, 0.5, 0.7, 0.8], [0, 1, 1, 0]) }}
        >
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-widest text-white">Montages</h2>
          <div className="w-full max-w-2xl h-[4px] bg-[#333] relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-[#4ade80]"
              style={{ width: useTransform(scrollYProgress, [0.4, 0.7], ["0%", "100%"]) }}
            />
            <div className="absolute top-4 left-0 text-xs font-mono text-white/50">00:00</div>
            <div className="absolute top-4 right-0 text-xs font-mono text-white/50">03:42</div>
          </div>
          <div className="mt-8 flex flex-col items-center">
            <span className="text-6xl md:text-8xl font-black">~400</span>
            <span className="font-mono uppercase tracking-widest text-white">Subscribers</span>
          </div>
        </motion.div>

        <motion.div 
          className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center gap-8 text-center"
          style={{ opacity: useTransform(scrollYProgress, [0.8, 0.9], [0, 1]) }}
        >
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter">
            Almost went<br/>competitive.
          </h2>
          <p className="mt-12 text-sm font-mono text-white/40 uppercase tracking-widest">Then I found another rabbit hole.</p>
        </motion.div>

      </div>
    </section>
  );
}
"""

files["Chapter05Rubiks.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter05Rubiks() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });

  return (
    <section ref={container} className="relative w-full h-[200vh] bg-black text-white overflow-hidden">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center">
        
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
          style={{ opacity: useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6], [0, 1, 1, 0]) }}
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
"""

files["Chapter06MUN.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter06MUN() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });
  const yDoc = useTransform(scrollYProgress, [0, 1], ["50%", "-50%"]);

  return (
    <section ref={container} className="relative w-full h-[250vh] bg-[#111] text-[#e0e0e0] overflow-hidden">
      <div className="sticky top-0 w-full h-screen flex items-center justify-center">
        
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
          style={{ opacity: useTransform(scrollYProgress, [0.1, 0.3, 0.6, 0.8], [0, 1, 1, 0]) }}
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
"""

files["Chapter07Anchoring.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter07Anchoring() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });
  
  const lightWidth = useTransform(scrollYProgress, [0.1, 0.4, 0.7, 0.9], ["0px", "600px", "600px", "0px"]);

  return (
    <section ref={container} className="relative w-full h-[250vh] bg-black text-white overflow-hidden">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center">
        
        {/* Spotlight */}
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 h-screen bg-gradient-to-b from-[#fff5d1]/20 to-transparent blur-3xl pointer-events-none"
          style={{ width: lightWidth }}
        />

        <motion.div 
          className="z-10 flex flex-col items-center gap-32 text-center"
        >
          <motion.div style={{ opacity: useTransform(scrollYProgress, [0, 0.1, 0.2, 0.3], [0, 1, 1, 0]) }}>
            <h3 className="font-mono text-xl uppercase tracking-widest text-white/50">Grade 6</h3>
            <h2 className="text-6xl font-black uppercase mt-4 text-[#fff5d1]">Mic On.</h2>
          </motion.div>
          
          <motion.div style={{ opacity: useTransform(scrollYProgress, [0.3, 0.4, 0.5, 0.6], [0, 1, 1, 0]) }}>
            <h3 className="font-mono text-xl uppercase tracking-widest text-white/50">Grade 7</h3>
            <h2 className="text-6xl font-black uppercase mt-4 text-[#fff5d1]">Mic On.</h2>
          </motion.div>

          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            style={{ opacity: useTransform(scrollYProgress, [0.6, 0.7, 0.9, 1], [0, 1, 1, 0]) }}
          >
            <h2 className="text-4xl md:text-7xl font-bold uppercase tracking-tighter leading-tight max-w-4xl px-6 text-center text-[#fff5d1]">
              Anchored one of the biggest events in my school.
            </h2>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
"""

files["Chapter08Moving.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter08Moving() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });

  return (
    <section ref={container} className="relative w-full h-[250vh] bg-[#080c11] text-[#93c5fd] overflow-hidden">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center">
        
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
          style={{ opacity: useTransform(scrollYProgress, [0, 0.1, 0.2, 0.3], [0, 1, 1, 0]) }}
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
"""

files["Chapter09Startups.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter09Startups() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });

  return (
    <section ref={container} className="relative w-full h-[300vh] bg-[#050a05] text-[#86efac] overflow-hidden font-mono">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center px-6">
        
        {/* Grid Background */}
        <div className="absolute inset-0 border border-[#86efac]/10 bg-[linear-gradient(rgba(134,239,172,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(134,239,172,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

        <motion.div 
          className="z-10 absolute inset-0 flex items-center justify-center text-center bg-[#050a05]/80"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.1, 0.2, 0.3], [0, 1, 1, 0]) }}
        >
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter">
            Then I started<br/>building.
          </h2>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 flex items-center justify-center"
          style={{ opacity: useTransform(scrollYProgress, [0.3, 0.4, 0.7, 0.8], [0, 1, 1, 0]) }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
            {[1, 2, 3].map((num) => (
              <div key={num} className="border border-[#86efac]/30 bg-black/50 p-6 flex flex-col gap-8 hover:bg-[#86efac]/10 transition-colors">
                <div className="text-xs uppercase tracking-widest text-[#86efac]/50 border-b border-[#86efac]/20 pb-4">
                  STARTUP 0{num}
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-white/50">FIELD:</span>
                  <span className="text-xl font-bold text-white uppercase">Software</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-white/50">WHAT I BUILT:</span>
                  <span className="text-lg text-white">Full-stack Product</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 bg-[#050a05] flex items-center justify-center text-center"
          style={{ opacity: useTransform(scrollYProgress, [0.8, 0.9], [0, 1]) }}
        >
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white">
            I made money<br/><span className="text-[#86efac]">from each.</span>
          </h2>
        </motion.div>

      </div>
    </section>
  );
}
"""

files["Chapter10Fitness.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter10Fitness() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });

  return (
    <section ref={container} className="relative w-full h-[250vh] bg-[#f5f5f5] text-black overflow-hidden font-mono">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center">
        
        <motion.div 
          className="z-10 absolute inset-0 flex flex-col items-center justify-center gap-4"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.2, 0.4, 0.5], [0, 1, 1, 0]) }}
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
"""

files["Chapter11JEE.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter11JEE() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });

  return (
    <section ref={container} className="relative w-full h-[300vh] bg-black text-white overflow-hidden">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center">
        
        {/* Chaos Grid */}
        <motion.div 
          className="absolute inset-0 flex flex-wrap opacity-20 pointer-events-none"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.2, 0.4, 0.5], [0, 0.3, 0.3, 0]) }}
        >
          {[...Array(200)].map((_, i) => (
            <div key={i} className="text-[8px] font-mono p-1 overflow-hidden">
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
"""

files["Chapter12Hackathons.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter12Hackathons() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });

  return (
    <section ref={container} className="relative w-full h-[250vh] bg-[#0a0a0a] text-[#bef264] overflow-hidden">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center px-6">
        
        {/* Rapid Cuts */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.1, 0.3, 0.4], [0, 1, 1, 0]) }}
        >
          <div className="flex flex-wrap gap-8 justify-center text-4xl md:text-7xl font-black uppercase tracking-tighter opacity-30">
            <span>Wireframes</span><span>Code</span><span>Pitch</span><span>Idea</span><span>Prototype</span><span>Demo</span><span>Error</span><span>Fix</span>
          </div>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 flex flex-col items-center justify-center gap-12"
          style={{ opacity: useTransform(scrollYProgress, [0.4, 0.5, 0.7, 0.8], [0, 1, 1, 0]) }}
        >
          <div className="flex flex-col gap-4 text-center border-b border-[#bef264]/20 pb-8">
            <h3 className="text-3xl md:text-5xl font-bold uppercase text-white">Smart India Hackathon</h3>
          </div>
          <div className="flex flex-col gap-4 text-center border-b border-[#bef264]/20 pb-8">
            <h3 className="text-2xl md:text-4xl font-bold uppercase text-white">IIT Roorkee Productathon</h3>
            <span className="text-xl font-mono text-[#bef264]">~4th Position</span>
          </div>
          <div className="flex flex-col gap-4 text-center">
            <h3 className="text-2xl md:text-4xl font-bold uppercase text-white">Ashoka Univ Fashion Hackathon</h3>
            <span className="text-xl font-mono text-[#bef264]">2nd Position</span>
          </div>
        </motion.div>

        <motion.div 
          className="z-10 absolute inset-0 bg-[#0a0a0a] flex items-center justify-center text-center"
          style={{ opacity: useTransform(scrollYProgress, [0.8, 0.9], [0, 1]) }}
        >
          <h2 className="text-[5rem] md:text-[10rem] font-black uppercase tracking-tighter leading-none flex flex-col">
            <span className="text-white">Build.</span>
            <span className="text-white/80">Break.</span>
            <span className="text-white/60">Pitch.</span>
            <span className="text-[#bef264]">Repeat.</span>
          </h2>
        </motion.div>

      </div>
    </section>
  );
}
"""

files["Chapter13Pattern.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter13Pattern() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });

  return (
    <section ref={container} className="relative w-full h-[400vh] bg-black text-white overflow-hidden">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center text-center px-6">
        
        <motion.div style={{ opacity: useTransform(scrollYProgress, [0, 0.1, 0.15, 0.2], [0, 1, 1, 0]) }}>
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
"""

files["Chapter14Now.tsx"] = """
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Chapter14Now() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });

  return (
    <section ref={container} className="relative w-full h-[250vh] bg-white text-black overflow-hidden">
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center px-6">
        
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center gap-16"
          style={{ opacity: useTransform(scrollYProgress, [0, 0.2, 0.6, 0.8], [0, 1, 1, 0]) }}
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
"""

files["Chapter15Final.tsx"] = """
"use client";

export function Chapter15Final() {
  return (
    <section className="relative w-full h-screen bg-black text-white flex flex-col items-center justify-center text-center px-6">
      <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none mb-16">
        The story<br/>is still<br/>loading.
      </h2>
      <div className="flex flex-col gap-4 font-mono text-xs uppercase tracking-widest text-white/50">
        <span>Life Log_∞</span>
        <a href="/" className="hover:text-white transition-colors mt-8">Back to Home &rarr;</a>
      </div>
    </section>
  );
}
"""

for filename, content in files.items():
    with open(os.path.join(components_dir, filename), "w") as f:
        f.write(content.strip() + "\n")

print("Created 15 chapter components.")
