cat << 'EOF' > app/life/page.tsx
import { Metadata } from "next";
import { LifeHero } from "@/components/life/LifeHero";
import { LifeStats } from "@/components/life/LifeStats";
import { ChapterSports } from "@/components/life/ChapterSports";
import { ChapterSocial } from "@/components/life/ChapterSocial";
import { ChapterMinecraft } from "@/components/life/ChapterMinecraft";
import { ChapterRubiks } from "@/components/life/ChapterRubiks";
import { ChapterMUN } from "@/components/life/ChapterMUN";
import { ChapterAnchoring } from "@/components/life/ChapterAnchoring";
import { ChapterMoving } from "@/components/life/ChapterMoving";
import { ChapterStartups } from "@/components/life/ChapterStartups";
import { ChapterFitness } from "@/components/life/ChapterFitness";
import { ChapterJEE } from "@/components/life/ChapterJEE";
import { ChapterHackathons } from "@/components/life/ChapterHackathons";
import { PatternTransition } from "@/components/life/PatternTransition";
import { CoreValues } from "@/components/life/CoreValues";
import { CurrentChapter } from "@/components/life/CurrentChapter";
import { FutureChapter } from "@/components/life/FutureChapter";

export const metadata: Metadata = {
  title: "Josh / Life",
  description: "Not a résumé. Just the receipts.",
};

export default function LifePage() {
  return (
    <main className="relative w-full bg-bg text-fg min-h-screen">
      <LifeHero />
      <LifeStats />
      
      <div className="relative w-full flex flex-col items-center">
        <ChapterSports />
        <ChapterSocial />
        <ChapterMinecraft />
        <ChapterRubiks />
        <ChapterMUN />
        <ChapterAnchoring />
        <ChapterMoving />
        <ChapterStartups />
        <ChapterFitness />
        <ChapterJEE />
        <ChapterHackathons />
      </div>

      <PatternTransition />
      <CoreValues />
      <CurrentChapter />
      <FutureChapter />
    </main>
  );
}
EOF

cat << 'EOF' > components/life/ChapterSports.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterSports() {
  return (
    <LifeChapter year="14" label="COMPETING">
      <div className="w-full flex flex-col gap-12 md:gap-24 items-start">
        <motion.h2 
          initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-bold tracking-tighter"
        >
          I TRIED TO<br />GO PRO.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-4 border-l-2 border-accent pl-6"
          >
            <h3 className="text-3xl md:text-4xl font-bold">ROLLER SKATING</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">STATE LEVEL</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-4 border-l-2 border-accent pl-6"
          >
            <h3 className="text-3xl md:text-4xl font-bold">YOGA</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">STATE LEVEL</p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="w-full mt-12"
        >
          <div className="inline-block px-6 py-4 bg-fg text-bg font-mono text-sm md:text-base font-bold uppercase tracking-widest">
            20–25 MEDALS
          </div>
          <p className="mt-8 text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed">
            I tried to go pro. I reached state level. I won medals. Then life moved in another direction.
          </p>
        </motion.div>
      </div>
    </LifeChapter>
  );
}
EOF

cat << 'EOF' > components/life/ChapterSocial.tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { LifeChapter } from "./LifeChapter";

export function ChapterSocial() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <LifeChapter year="15" label="CONTENT" className="bg-[#111]">
      <div ref={containerRef} className="w-full flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:w-1/2 flex flex-col gap-8 z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold tracking-tighter"
          >
            Before I knew what a startup was, I was already trying to get strangers on the internet to pay attention.
          </motion.h2>
          
          <div className="flex gap-4 font-mono text-xs uppercase tracking-widest text-accent">
            <span>INSTAGRAM</span>
            <span>//</span>
            <span>CONTENT CREATION</span>
          </div>
        </div>

        <div className="w-full md:w-1/2 h-[600px] relative overflow-hidden rounded-xl border border-line bg-black/50 flex gap-4 p-4">
          {/* Simulated Infinite Feed Columns */}
          <motion.div style={{ y: y1 }} className="flex-1 flex flex-col gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full aspect-[4/5] bg-bg-soft rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </motion.div>
          
          <motion.div style={{ y: y2 }} className="flex-1 flex flex-col gap-4 mt-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full aspect-square bg-bg-soft rounded-lg flex items-center justify-center p-4 text-center">
                {i === 2 && <span className="font-bold text-xl">10M+<br/><span className="text-[10px] text-fg-soft font-mono">VIEWS</span></span>}
              </div>
            ))}
          </motion.div>

          <motion.div style={{ y: y3 }} className="flex-1 flex flex-col gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full aspect-[4/5] bg-bg-soft rounded-lg flex items-center justify-center p-4 text-center">
                {i === 1 && <span className="font-bold text-xl">2K+<br/><span className="text-[10px] text-fg-soft font-mono">FOLLOWERS</span></span>}
              </div>
            ))}
          </motion.div>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-[#111] pointer-events-none" />
        </div>
      </div>
    </LifeChapter>
  );
}
EOF

cat << 'EOF' > components/life/ChapterMinecraft.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterMinecraft() {
  return (
    <LifeChapter year="16" label="GAMING" className="bg-[#0a0a0a]">
      <div className="w-full flex flex-col items-center gap-16 font-mono">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-5xl md:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-600 uppercase" style={{ imageRendering: 'pixelated' }}>
            I WAS OBSESSED.
          </h2>
          <p className="mt-6 text-xl text-fg-soft uppercase tracking-widest">
            Almost went competitive.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
          {['BEDWARS', 'SKYWARS', 'MONTAGES', '~400 SUBSCRIBERS'].map((tag, i) => (
            <motion.div 
              key={tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border-2 border-line bg-bg-soft p-4 flex items-center justify-center text-center uppercase tracking-widest text-xs md:text-sm hover:border-accent hover:bg-accent/10 transition-colors cursor-crosshair"
            >
              {tag}
            </motion.div>
          ))}
        </div>

        {/* Fake Video Player */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-4xl aspect-video bg-black border-4 border-[#333] relative flex items-center justify-center group cursor-crosshair overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
          
          <div className="w-16 h-16 bg-white/10 group-hover:bg-accent/20 transition-colors flex items-center justify-center rounded-full backdrop-blur-sm">
            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white group-hover:border-l-accent border-b-[12px] border-b-transparent ml-2 transition-colors" />
          </div>

          {/* Player HUD */}
          <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-2">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-accent" />
            </div>
            <div className="flex justify-between text-[10px] text-white/50 tracking-widest">
              <span>01:24</span>
              <span className="uppercase">old montage.mp4</span>
              <span>03:42</span>
            </div>
          </div>
        </motion.div>
      </div>
    </LifeChapter>
  );
}
EOF

cat << 'EOF' > components/life/ChapterRubiks.tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { LifeChapter } from "./LifeChapter";

export function ChapterRubiks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [0, 720]);
  
  const [mouseRot, setMouseRot] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / 10;
      const y = -(e.clientY - rect.top - rect.height / 2) / 10;
      setMouseRot({ x: y, y: x });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <LifeChapter year="14" label="OBSESSION" className="bg-bg">
      <div ref={containerRef} className="w-full flex flex-col md:flex-row items-center gap-16 min-h-[60vh] perspective-1000">
        
        <div className="w-full md:w-1/2 flex flex-col gap-6 z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight"
          >
            14 YEARS OLD.<br/>
            7+ CUBES.<br/>
            WAY TOO MUCH TIME.
          </motion.h2>
        </div>

        <div className="w-full md:w-1/2 flex justify-center items-center h-full relative" style={{ perspective: "1000px" }}>
          <motion.div 
            style={{ 
              rotateX: rotateX, 
              rotateY: rotateY,
              transformStyle: "preserve-3d"
            }}
            animate={{ 
              rotateX: mouseRot.x,
              rotateY: mouseRot.y
            }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            className="w-48 h-48 md:w-64 md:h-64 relative"
          >
            {/* Front */}
            <div className="absolute inset-0 border-2 border-accent bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform translate-z-[96px] md:translate-z-[128px]">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-accent/20 border border-accent/50" />)}
            </div>
            {/* Back */}
            <div className="absolute inset-0 border-2 border-line bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform -translate-z-[96px] md:-translate-z-[128px] rotate-y-180">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 border border-line" />)}
            </div>
            {/* Right */}
            <div className="absolute inset-0 border-2 border-line bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform translate-x-[96px] md:translate-x-[128px] rotate-y-90">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 border border-line" />)}
            </div>
            {/* Left */}
            <div className="absolute inset-0 border-2 border-line bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform -translate-x-[96px] md:-translate-x-[128px] -rotate-y-90">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 border border-line" />)}
            </div>
            {/* Top */}
            <div className="absolute inset-0 border-2 border-line bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform -translate-y-[96px] md:-translate-y-[128px] rotate-x-90">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 border border-line" />)}
            </div>
            {/* Bottom */}
            <div className="absolute inset-0 border-2 border-line bg-bg-soft/80 backdrop-blur-sm grid grid-cols-3 grid-rows-3 gap-1 p-1 transform translate-y-[96px] md:translate-y-[128px] -rotate-x-90">
              {[...Array(9)].map((_, i) => <div key={i} className="bg-white/5 border border-line" />)}
            </div>
          </motion.div>
        </div>

      </div>
    </LifeChapter>
  );
}
EOF

cat << 'EOF' > components/life/ChapterMUN.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterMUN() {
  return (
    <LifeChapter year="15" label="DEBATE" className="bg-[#e5e5e5] text-black">
      <div className="w-full flex flex-col md:flex-row items-center gap-16">
        
        <div className="w-full md:w-1/2">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-serif font-bold tracking-tight leading-none"
          >
            LEARNED TO ARGUE BEFORE I LEARNED TO CODE.
          </motion.h2>
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-8 relative">
          <motion.div 
            initial={{ opacity: 0, rotate: -2, x: 20 }}
            whileInView={{ opacity: 1, rotate: 0, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="bg-white p-8 md:p-12 shadow-2xl border border-neutral-300 flex flex-col gap-6 font-mono text-sm"
          >
            <div className="flex justify-between border-b-2 border-black pb-4 mb-4">
              <span className="font-bold tracking-widest">OFFICIAL RECORD</span>
              <span>CONFIDENTIAL</span>
            </div>
            
            <p className="leading-relaxed">
              DELEGATE STATUS: <span className="bg-black text-white px-2 py-1 font-bold">2ND BEST DELEGATE</span><br/><br/>
              ATTENDANCE: MULTIPLE CONFERENCES<br/><br/>
              NOTES: <span className="bg-black text-black select-none">Demonstrated high adaptability.</span> Argued complex geopolitical positions. <span className="bg-black text-black select-none">REDACTED.</span> Found a way to win arguments even when the initial position was weak.
            </p>
            
            <div className="mt-8 flex justify-end">
              <div className="border-t border-black pt-2 text-xs">AUTHORIZED SIGNATURE</div>
            </div>
          </motion.div>
        </div>

      </div>
    </LifeChapter>
  );
}
EOF

cat << 'EOF' > components/life/ChapterAnchoring.tsx
"use client";

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { LifeChapter } from "./LifeChapter";

export function ChapterAnchoring() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} className="relative w-full cursor-none overflow-hidden bg-black">
      <div 
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, transparent 0%, rgba(0,0,0,0.95) 100%)`
        }}
      />
      
      <LifeChapter year="11" label="SPEAKING" className="bg-transparent">
        <div className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center gap-12 relative z-0">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-7xl md:text-[10vw] font-bold tracking-tighter leading-none"
          >
            MIC ON.
          </motion.h2>

          <div className="flex gap-12 md:gap-24 font-mono text-sm md:text-xl uppercase tracking-widest text-fg-soft">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-2"
            >
              <span className="text-white font-bold">GRADE 6</span>
              <span>ANCHOR</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-2"
            >
              <span className="text-white font-bold">GRADE 7</span>
              <span>ANCHOR</span>
            </motion.div>
          </div>
          
          {/* Audio Waveform Simulation */}
          <div className="flex items-center justify-center gap-1 h-12 mt-12 opacity-50">
            {[...Array(20)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: ["20%", "100%", "20%"] }}
                transition={{ 
                  duration: 0.5 + Math.random() * 0.5, 
                  repeat: Infinity, 
                  delay: Math.random() 
                }}
                className="w-1 md:w-2 bg-white rounded-full"
              />
            ))}
          </div>
        </div>
      </LifeChapter>
    </div>
  );
}
EOF

cat << 'EOF' > components/life/ChapterMoving.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterMoving() {
  return (
    <LifeChapter year="15" label="ADJUSTING" className="bg-bg">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-16 min-h-[60vh]">
        
        <div className="w-full md:w-1/2 flex flex-col gap-12 z-10">
          <motion.h2 
            initial={{ opacity: 0, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="text-5xl md:text-8xl font-bold tracking-tighter text-fg-soft"
          >
            HOME<br/>MOVED.
          </motion.h2>

          <div className="flex flex-col gap-2 font-mono text-xl tracking-widest">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-fg font-bold"
            >
              5 HOMES
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 1 }}
              className="text-fg-soft"
            >
              3 YEARS
            </motion.span>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1, duration: 1.5 }}
            className="text-xl md:text-2xl text-fg-soft max-w-md leading-relaxed mt-8"
          >
            Some years weren't about winning anything.<br/>
            Some years were just about adjusting.
          </motion.p>
        </div>

        {/* Fragmented map visualization */}
        <div className="w-full md:w-1/2 h-full relative flex items-center justify-center opacity-50">
          <svg className="w-full max-w-md aspect-square" viewBox="0 0 100 100">
            <motion.path 
              d="M 10,90 L 30,60 L 20,40 L 60,30 L 80,10" 
              fill="none" 
              stroke="var(--color-line)" 
              strokeWidth="0.5"
              strokeDasharray="2 2"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
            {[
              { cx: 10, cy: 90 },
              { cx: 30, cy: 60 },
              { cx: 20, cy: 40 },
              { cx: 60, cy: 30 },
              { cx: 80, cy: 10 },
            ].map((p, i) => (
              <motion.circle 
                key={i}
                cx={p.cx} 
                cy={p.cy} 
                r="1" 
                fill="var(--color-fg-soft)"
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.6 + 0.5 }}
              />
            ))}
          </svg>
        </div>

      </div>
    </LifeChapter>
  );
}
EOF

cat << 'EOF' > components/life/ChapterStartups.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

const STARTUPS = [
  {
    name: "STARTUP_01",
    year: "2023",
    description: "Built the initial prototype. Acquired first 100 users.",
    lesson: "Distribution is harder than product.",
    status: "ACQUIRED"
  },
  {
    name: "STARTUP_02",
    year: "2024",
    description: "Scaled to meaningful MRR. B2B SaaS.",
    lesson: "B2B sales is just listening.",
    status: "ACTIVE"
  },
  {
    name: "STARTUP_03",
    year: "2025",
    description: "AI workflow automation platform.",
    lesson: "Speed is the only moat.",
    status: "ACTIVE"
  }
];

export function ChapterStartups() {
  return (
    <LifeChapter year="17" label="BUILDING" className="bg-bg">
      <div className="w-full flex flex-col gap-16">
        
        <div className="w-full flex flex-col md:flex-row justify-between items-end gap-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-bold tracking-tighter"
          >
            THEN I STARTED<br/>BUILDING.
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-right font-mono text-sm uppercase tracking-widest text-fg-soft"
          >
            <span className="text-4xl text-fg font-bold block mb-2">03</span>
            STARTUPS
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {STARTUPS.map((startup, i) => (
            <motion.div 
              key={startup.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="group border border-line bg-bg-soft/50 rounded-2xl p-6 md:p-8 flex flex-col gap-8 hover:bg-bg-soft hover:border-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start font-mono text-xs uppercase tracking-widest">
                <span className="text-fg-soft">{startup.year}</span>
                <span className={startup.status === "ACTIVE" ? "text-accent" : "text-fg-soft"}>
                  {startup.status}
                </span>
              </div>
              
              <div className="flex flex-col gap-4 flex-1">
                <h3 className="text-2xl font-bold">{startup.name}</h3>
                <p className="text-fg-soft text-sm leading-relaxed">{startup.description}</p>
              </div>

              <div className="pt-6 border-t border-line/50 font-mono text-[10px] uppercase tracking-widest text-fg-soft">
                LESSON // {startup.lesson}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </LifeChapter>
  );
}
EOF

cat << 'EOF' > components/life/ChapterFitness.tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { LifeChapter } from "./LifeChapter";

export function ChapterFitness() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const o1 = useTransform(scrollYProgress, [0, 0.2], [0.2, 1]);
  const o2 = useTransform(scrollYProgress, [0.2, 0.4], [0.2, 1]);
  const o3 = useTransform(scrollYProgress, [0.4, 0.6], [0.2, 1]);
  const o4 = useTransform(scrollYProgress, [0.6, 0.8], [0.2, 1]);

  return (
    <LifeChapter year="18" label="TRAINING" className="bg-[#111]">
      <div ref={containerRef} className="w-full flex flex-col gap-24 items-center justify-center min-h-[80vh]">
        
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-mono tracking-tighter uppercase text-center"
        >
          BUILT THE BODY TOO.
        </motion.h2>

        <div className="flex flex-col gap-6 md:gap-12 items-center text-4xl md:text-8xl font-bold tracking-tighter uppercase">
          <motion.span style={{ opacity: o1 }}>DISCIPLINE</motion.span>
          <motion.span style={{ opacity: o2 }}>TRAINING</motion.span>
          <motion.span style={{ opacity: o3 }}>NUTRITION</motion.span>
          <motion.span style={{ opacity: o4 }} className="text-accent">CONSISTENCY</motion.span>
        </div>

      </div>
    </LifeChapter>
  );
}
EOF

cat << 'EOF' > components/life/ChapterJEE.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterJEE() {
  return (
    <LifeChapter year="18" label="FAILURE" className="bg-bg">
      <div className="w-full flex flex-col items-center justify-center min-h-[70vh] gap-16 text-center">
        
        <motion.h2 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-5xl md:text-8xl font-bold tracking-tighter line-through decoration-fg-soft/50 decoration-8"
        >
          THIS ONE DIDN'T WORK.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 w-full max-w-3xl border-y border-line/30 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-2"
          >
            <span className="text-3xl font-mono font-bold">~2 YEARS</span>
            <span className="font-mono text-sm tracking-widest text-fg-soft">OF PREPARATION</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-2"
          >
            <span className="text-3xl font-mono font-bold text-fg-soft">IIT</span>
            <span className="font-mono text-sm tracking-widest text-accent">NOT HAPPENING</span>
          </motion.div>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 2 }}
          className="text-xl md:text-2xl text-fg-soft max-w-md leading-relaxed mt-12"
        >
          Some plans end.<br/>
          <span className="text-fg">The person doesn't.</span>
        </motion.p>

      </div>
    </LifeChapter>
  );
}
EOF

cat << 'EOF' > components/life/ChapterHackathons.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterHackathons() {
  return (
    <LifeChapter year="18" label="HACKATHONS" className="bg-[#f5f5f5] text-black overflow-visible">
      <div className="w-full flex flex-col items-center justify-center min-h-[80vh] relative z-10">
        
        <motion.h2 
          initial={{ opacity: 0, scale: 2 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="text-6xl md:text-[8vw] font-bold tracking-tighter leading-none text-center z-20 mix-blend-difference text-white"
        >
          BUILD.<br/>BREAK.<br/>PITCH.<br/>REPEAT.
        </motion.h2>

        {/* Floating Notes */}
        <motion.div 
          initial={{ opacity: 0, rotate: -10, x: -100, y: -50 }}
          whileInView={{ opacity: 1, rotate: -6, x: 0, y: 0 }}
          viewport={{ once: true }}
          className="absolute top-1/4 left-0 md:left-1/4 bg-[#FFEB3B] p-6 shadow-xl w-64 h-64 flex flex-col gap-4 font-mono z-10"
        >
          <span className="font-bold text-xl border-b-2 border-black/20 pb-2">IIT ROORKEE</span>
          <span className="text-sm">Productathon</span>
          <span className="text-4xl font-bold mt-auto">~4TH</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, rotate: 10, x: 100, y: 50 }}
          whileInView={{ opacity: 1, rotate: 4, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-1/4 right-0 md:right-1/4 bg-[#00E5FF] p-6 shadow-xl w-64 h-64 flex flex-col gap-4 font-mono z-10"
        >
          <span className="font-bold text-xl border-b-2 border-black/20 pb-2">ASHOKA UNIV.</span>
          <span className="text-sm">Fashion Design Hackathon</span>
          <span className="text-4xl font-bold mt-auto">2ND</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black text-white p-6 shadow-2xl flex flex-col gap-2 font-mono z-30"
        >
          <span className="font-bold text-xl">SMART INDIA HACKATHON</span>
          <span className="text-sm text-white/50 tracking-widest">PARTICIPATED</span>
        </motion.div>

      </div>
    </LifeChapter>
  );
}
EOF

cat components/life/ChapterMinecraft.tsx
cat components/life/ChapterSports.tsx
cat components/life/ChapterSports.tsx
cat components/life/ChapterSports.tsx
cat << 'EOF' > update_chapter_sports.py
import re

with open('components/life/ChapterSports.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'import { motion } from "framer-motion";',
    'import { motion } from "framer-motion";\nimport { useState, useRef } from "react";\nimport { useLenis } from "lenis/react";'
)

hooks = """export function ChapterSports() {
  const [isVisible, setIsVisible] = useState(false);
  
  useLenis((lenis) => {
    // 2.2 is roughly 220vh, which is right after the particles scatter (which ends at 212.5vh)
    if (lenis.scroll > window.innerHeight * 2.2) {
      if (!isVisible) setIsVisible(true);
    }
  });"""

content = content.replace('export function ChapterSports() {', hooks)

content = content.replace(
    'whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}\n          viewport={{ once: true }}',
    'animate={isVisible ? { opacity: 1, x: 0, filter: "blur(0px)" } : { opacity: 0, x: -50, filter: "blur(10px)" }}'
)

content = content.replace(
    'whileInView={{ opacity: 1, scaleX: 1 }}\n            viewport={{ once: true }}',
    'animate={isVisible ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.8 }}'
)

content = content.replace(
    'whileInView={{ opacity: 1, y: 0 }}\n          viewport={{ once: true }}',
    'animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}'
)

with open('components/life/ChapterSports.tsx', 'w') as f:
    f.write(content)
EOF
python3 update_chapter_sports.py
cat << 'EOF' > revert_sports.py
content = """"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterSports() {
  return (
    <LifeChapter year="14" label="COMPETING">
      <div className="w-full flex flex-col gap-12 md:gap-24 items-start">
        <motion.h2 
          initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-bold tracking-tighter"
        >
          I TRIED TO<br />GO PRO.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-4 border-l-2 border-accent pl-6"
          >
            <h3 className="text-3xl md:text-4xl font-bold">ROLLER SKATING</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">STATE LEVEL</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-4 border-l-2 border-accent pl-6"
          >
            <h3 className="text-3xl md:text-4xl font-bold">YOGA</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">STATE LEVEL</p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="w-full mt-12"
        >
          <div className="inline-block px-6 py-4 bg-fg text-bg font-mono text-sm md:text-base font-bold uppercase tracking-widest">
            20–25 MEDALS
          </div>
          <p className="mt-8 text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed">
            I tried to go pro. I reached state level. I won medals. Then life moved in another direction.
          </p>
        </motion.div>
      </div>
    </LifeChapter>
  );
}
"""

with open('components/life/ChapterSports.tsx', 'w') as f:
    f.write(content)
EOF
python3 revert_sports.py
cat << 'EOF' > fix_page.py
content = """import { Metadata } from "next";
import { LifeHero } from "@/components/life/LifeHero";
import { ChapterSports } from "@/components/life/ChapterSports";
import { ChapterSocial } from "@/components/life/ChapterSocial";
import { ChapterMinecraft } from "@/components/life/ChapterMinecraft";
import { ChapterRubiks } from "@/components/life/ChapterRubiks";
import { ChapterMUN } from "@/components/life/ChapterMUN";
import { ChapterAnchoring } from "@/components/life/ChapterAnchoring";
import { ChapterMoving } from "@/components/life/ChapterMoving";
import { ChapterStartups } from "@/components/life/ChapterStartups";
import { ChapterFitness } from "@/components/life/ChapterFitness";
import { ChapterJEE } from "@/components/life/ChapterJEE";
import { ChapterHackathons } from "@/components/life/ChapterHackathons";
import { PatternTransition } from "@/components/life/PatternTransition";
import { CoreValues } from "@/components/life/CoreValues";
import { CurrentChapter } from "@/components/life/CurrentChapter";
import { FutureChapter } from "@/components/life/FutureChapter";
import { LifeNav } from "@/components/life/LifeNav";
import { LifeTimeline } from "@/components/life/LifeTimeline";
import { HorizontalScrollGroup } from "@/components/life/HorizontalScrollGroup";

export const metadata: Metadata = {
  title: "Josh / Life",
  description: "Not a résumé. Just the receipts.",
};

export default function LifePage() {
  return (
    <main className="relative w-full bg-bg text-fg min-h-screen">
      <LifeNav />
      <LifeTimeline />
      <LifeHero />
      
      <div className="relative w-full flex flex-col items-center">
        <HorizontalScrollGroup numPanels={3}>
          <ChapterSports />
          <ChapterSocial />
          <ChapterMinecraft />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={3}>
          <ChapterRubiks />
          <ChapterMUN />
          <ChapterAnchoring />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={5}>
          <ChapterMoving />
          <ChapterStartups />
          <ChapterFitness />
          <ChapterJEE />
          <ChapterHackathons />
        </HorizontalScrollGroup>
      </div>

      <PatternTransition />
      <CoreValues />
      <CurrentChapter />
      <FutureChapter />
    </main>
  );
}
"""
with open('app/life/page.tsx', 'w') as f:
    f.write(content)
EOF
python3 fix_page.py
cat components/life/ChapterSports.tsx
cat << 'EOF' > rewrite_sports.py
with open('components/life/ChapterSports.tsx', 'r') as f:
    content = f.read()

import re

new_content = """"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

const sports = [
  { name: "ROLLER SKATING", level: "STATE LEVEL" },
  { name: "YOGA", level: "STATE LEVEL" },
  { name: "FOOTBALL", level: "PROFICIENT" },
  { name: "BADMINTON", level: "PROFICIENT" },
  { name: "VOLLEYBALL", level: "PROFICIENT" },
  { name: "RUNNING", level: "PROFICIENT" }
];

export function ChapterSports() {
  return (
    <LifeChapter year="14" label="COMPETING">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.h2 
          initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-bold tracking-tighter uppercase"
          style={{ color: "#FF5722" }}
        >
          I TRIED TO<br />GO PRO.
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8 w-full">
          {sports.map((sport, idx) => (
            <motion.div 
              key={sport.name}
              initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + (idx * 0.1) }}
              className="flex flex-col gap-2 border-l-[3px] pl-4 md:pl-6"
              style={{ borderColor: "#FF5722" }}
            >
              <h3 className="text-xl md:text-3xl font-bold">{sport.name}</h3>
              <p className="font-mono text-xs md:text-sm text-fg-soft tracking-widest uppercase">{sport.level}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="w-full mt-8"
        >
          <div 
            className="inline-block px-6 py-4 font-mono text-sm md:text-base font-bold uppercase tracking-widest text-[#111]"
            style={{ backgroundColor: "#FF5722" }}
          >
            20–25 MEDALS
          </div>
          <p className="mt-8 text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed">
            I tried to go pro. I reached state level. I won medals. Played them and became proficient in every one of those but never pursued them. Then life moved in another direction.
          </p>
        </motion.div>
      </div>
    </LifeChapter>
  );
}
"""

with open('components/life/ChapterSports.tsx', 'w') as f:
    f.write(new_content)
EOF
python3 rewrite_sports.py
mv components/life/ChapterSports.tsx components/life/ChapterRollerSkating.tsx
cat << 'EOF' > components/life/ChapterRollerSkating.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterRollerSkating() {
  return (
    <LifeChapter year="15–18" label="COMPETING">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.h2 
          initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl md:text-7xl font-bold tracking-tighter uppercase"
        >
          I GOT OBSESSED WITH<br />
          <span className="text-accent">WHEELS ON MY FEET.</span>
        </motion.h2>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold tracking-widest text-fg-soft mb-8">ROLLER SKATING</h3>
          <div className="flex flex-col gap-2 font-mono text-sm uppercase tracking-widest leading-loose">
            <p>I started skating.</p>
            <p>Then I started competing.</p>
            <p>Then I started chasing the next level.</p>
            <p className="mt-4 text-accent">I made it to state.</p>
            <p className="text-accent">Silver.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8 w-full mt-8">
          {[
            { label: "COMPETITIONS", value: "12" },
            { label: "MEDALS", value: "15" },
            { label: "GOLD", value: "04", color: "text-[#FFD700]" },
            { label: "SILVER", value: "08", color: "text-[#C0C0C0]" },
            { label: "BRONZE", value: "03", color: "text-[#CD7F32]" },
            { label: "RANK", value: "STATE", color: "text-accent" },
          ].map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 + (idx * 0.1) }}
              className="flex flex-col gap-2 border-l-[2px] border-fg/20 pl-4"
            >
              <h3 className={`text-4xl md:text-5xl font-bold ${stat.color || ""}`}>{stat.value}</h3>
              <p className="font-mono text-xs text-fg-soft tracking-widest uppercase">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterTransition.tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface ChapterTransitionProps {
  lines: string[];
  finalLine?: string;
}

export function ChapterTransition({ lines, finalLine }: ChapterTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  return (
    <section ref={ref} className="relative w-screen h-[150vh] shrink-0 flex flex-col items-center justify-center bg-bg">
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center px-6 text-center">
        {lines.map((line, idx) => {
          const start = 0.1 + (idx * 0.2);
          const peak = start + 0.1;
          const end = peak + 0.1;
          
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const opacity = useTransform(
            scrollYProgress,
            [start, peak, end, 0.9],
            [0, 1, 1, 0]
          );
          
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const y = useTransform(
            scrollYProgress,
            [start, peak],
            [20, 0]
          );

          return (
            <motion.h2 
              key={idx}
              style={{ opacity, y }}
              className="absolute text-2xl md:text-5xl font-bold tracking-tighter uppercase text-fg-soft"
            >
              {line}
            </motion.h2>
          );
        })}
        
        {finalLine && (
          <motion.h1
            style={{ 
              opacity: useTransform(scrollYProgress, [0.7, 0.85], [0, 1]),
              scale: useTransform(scrollYProgress, [0.7, 0.85], [0.9, 1])
            }}
            className="absolute text-5xl md:text-8xl font-bold tracking-tighter uppercase text-accent"
          >
            {finalLine}
          </motion.h1>
        )}
      </div>
    </section>
  );
}
EOF
cat << 'EOF' > components/life/ChapterYoga.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterYoga() {
  return (
    <LifeChapter year="—" label="COMPETING">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block px-4 py-2 bg-fg text-bg font-mono text-sm md:text-base font-bold uppercase tracking-widest mb-8">
            STATE LEVEL
          </div>
          <p className="text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed">
            I became seriously involved in yoga. The pattern repeated itself.
          </p>
        </motion.div>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterSocial.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterSocial() {
  return (
    <LifeChapter year="—" label="CONTENT">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-2 border-l-2 border-accent pl-6"
          >
            <h3 className="text-4xl md:text-6xl font-bold">2K+</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">FOLLOWERS ON ONE PAGE</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-2 border-l-2 border-accent pl-6"
          >
            <h3 className="text-4xl md:text-6xl font-bold">10M+</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">VIEWS ON ANOTHER</p>
          </motion.div>
        </div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed"
        >
          Before I knew anything about marketing, I was already trying to get strangers on the internet to pay attention.
        </motion.p>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterMinecraft.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterMinecraft() {
  return (
    <LifeChapter year="—" label="GAMING">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.h2 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold tracking-tighter"
        >
          BEDWARS.<br />
          SKYWARS.
        </motion.h2>

        <div className="flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-2"
          >
            <h3 className="text-3xl font-bold text-accent">~400</h3>
            <p className="font-mono text-xs text-fg-soft tracking-widest uppercase">SUBSCRIBERS FROM MONTAGES</p>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed"
          >
            I got close to taking it seriously at a competitive level.
          </motion.p>
        </div>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterRubiks.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterRubiks() {
  return (
    <LifeChapter year="14" label="PUZZLES">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-2 border-l-2 border-accent pl-6"
        >
          <h3 className="text-4xl md:text-6xl font-bold">7+</h3>
          <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">DIFFERENT TYPES OF CUBES SOLVED</p>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed"
        >
          I have a habit of going too deep into things.
        </motion.p>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterMUN.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterMUN() {
  return (
    <LifeChapter year="—" label="DEBATE">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-2"
        >
          <div className="inline-block px-4 py-2 bg-fg text-bg font-mono text-sm md:text-base font-bold uppercase tracking-widest mb-4">
            2ND-BEST DELEGATE
          </div>
          <p className="font-mono text-xs md:text-sm text-fg-soft tracking-widest uppercase">ACROSS MULTIPLE MUN CONFERENCES</p>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed"
        >
          I learned how to argue before I learned how to code.
        </motion.p>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterAnchoring.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterAnchoring() {
  return (
    <LifeChapter year="—" label="STAGE">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-2"
        >
          <h3 className="text-3xl md:text-5xl font-bold">ANCHORED</h3>
          <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">ONE OF THE BIGGEST SCHOOL EVENTS. TWICE.</p>
          <div className="flex gap-4 mt-4 font-mono text-xs text-accent">
            <span>[GRADE 6]</span>
            <span>[GRADE 7]</span>
          </div>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed"
        >
          I learned how to hold a room.
        </motion.p>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterMoving.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterMoving() {
  return (
    <LifeChapter year="—" label="LIFE">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-2 border-l-2 border-fg/20 pl-6 opacity-70"
          >
            <h3 className="text-4xl md:text-6xl font-bold">5</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">HOMES</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-2 border-l-2 border-fg/20 pl-6 opacity-70"
          >
            <h3 className="text-4xl md:text-6xl font-bold">3</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">YEARS</p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col gap-4 mt-8"
        >
          <p className="text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed">
            Not every chapter was about winning.
          </p>
          <p className="text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed">
            Some were just about adjusting.
          </p>
        </motion.div>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterStartups.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterStartups() {
  return (
    <LifeChapter year="—" label="BUILDING">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-2 border-l-2 border-accent pl-6"
        >
          <h3 className="text-4xl md:text-6xl font-bold">3</h3>
          <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">STARTUPS. DIFFERENT FIELDS. REAL REVENUE.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col gap-4 mt-8"
        >
          <p className="text-xl md:text-3xl text-fg font-bold tracking-tight max-w-2xl leading-relaxed">
            Eventually, I stopped just trying things.
          </p>
          <p className="text-xl md:text-3xl text-accent font-bold tracking-tight max-w-2xl leading-relaxed">
            I started building things.
          </p>
        </motion.div>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterFitness.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterFitness() {
  return (
    <LifeChapter year="18" label="DISCIPLINE">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-2"
        >
          <p className="text-xl md:text-3xl text-fg font-bold tracking-tight max-w-2xl leading-relaxed">
            Built the body too.
          </p>
        </motion.div>

        <div className="flex flex-col gap-2 font-mono text-sm uppercase tracking-widest text-fg-soft mt-8">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>TRAINING</motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>CONSISTENCY</motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>NUTRITION</motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="text-accent">DISCIPLINE</motion.div>
        </div>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterJEE.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterJEE() {
  return (
    <LifeChapter year="—" label="REALITY CHECK">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.h2 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold tracking-tighter text-fg-soft"
        >
          THIS ONE DIDN'T WORK.
        </motion.h2>

        <div className="flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-2 border-l-2 border-fg/20 pl-6"
          >
            <h3 className="text-3xl font-bold">~2 YEARS</h3>
            <p className="font-mono text-xs text-fg-soft tracking-widest uppercase">OF PREPARATION</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-2 border-l-2 border-red-500/50 pl-6"
          >
            <h3 className="text-3xl font-bold line-through opacity-50">IIT</h3>
            <p className="font-mono text-xs text-red-400 tracking-widest uppercase">DIDN'T HAPPEN</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 1.0 }} // Deliberate visual silence delay
            className="mt-12"
          >
            <p className="text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed">
              Some plans end.
            </p>
            <p className="text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed mt-2">
              The person doesn't.
            </p>
          </motion.div>
        </div>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterHackathons.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

export function ChapterHackathons() {
  return (
    <LifeChapter year="—" label="PRESSURE">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xl md:text-3xl text-fg font-bold tracking-tight max-w-2xl leading-relaxed">
            Then I started building under pressure.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full mt-4">
          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-4 border-l-2 border-accent pl-6"
          >
            <h3 className="text-2xl font-bold">SMART INDIA HACKATHON</h3>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col gap-4 border-l-2 border-accent pl-6"
          >
            <h3 className="text-2xl font-bold">IIT ROORKEE PRODUCTATHON</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">~4TH POSITION</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-4 border-l-2 border-accent pl-6"
          >
            <h3 className="text-2xl font-bold">ASHOKA UNIV. HACKATHON</h3>
            <p className="font-mono text-sm text-fg-soft tracking-widest uppercase">2ND POSITION</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col gap-4 border-l-2 border-fg/20 pl-6"
          >
            <h3 className="text-2xl font-bold text-fg-soft">MULTIPLE OTHERS</h3>
          </motion.div>
        </div>

        <div className="flex flex-col gap-2 font-mono text-sm uppercase tracking-widest text-fg mt-8">
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }}>BUILD.</motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.7 }}>BREAK.</motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.8 }}>PITCH.</motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.9 }} className="text-accent">REPEAT.</motion.div>
        </div>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterEnding.tsx
"use client";

import { motion } from "framer-motion";

export function ChapterEnding() {
  return (
    <section className="relative w-screen min-h-[150vh] flex flex-col items-center justify-center bg-bg">
      <div className="flex flex-col items-center justify-center gap-12 text-center max-w-4xl px-6">
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1 }}
          className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase text-fg-soft"
        >
          SO WHAT'S THE PATTERN?
        </motion.p>

        <div className="flex flex-col gap-6 md:gap-8 mt-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-3xl md:text-5xl font-bold tracking-tighter uppercase"
          >
            I KEEP TRYING THINGS.
          </motion.h2>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1, delay: 1.5 }}
            className="text-3xl md:text-5xl font-bold tracking-tighter uppercase text-fg-soft"
          >
            SOME STUCK.
          </motion.h2>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1, delay: 2.5 }}
            className="text-3xl md:text-5xl font-bold tracking-tighter uppercase text-fg-soft"
          >
            SOME DIDN'T.
          </motion.h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1.5, delay: 4.0 }}
          className="mt-24 flex flex-col gap-8"
        >
          <p className="text-xl md:text-2xl text-fg max-w-2xl leading-relaxed">
            I'M STILL FIGURING OUT WHAT DESERVES THE NEXT FIVE YEARS.
          </p>
          <p className="text-xl md:text-2xl text-accent font-bold max-w-2xl leading-relaxed">
            STILL BUILDING.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
EOF
cat << 'EOF' > app/life/page.tsx
import { Metadata } from "next";
import { LifeHero } from "@/components/life/LifeHero";
import { ChapterRollerSkating } from "@/components/life/ChapterRollerSkating";
import { ChapterYoga } from "@/components/life/ChapterYoga";
import { ChapterSocial } from "@/components/life/ChapterSocial";
import { ChapterMinecraft } from "@/components/life/ChapterMinecraft";
import { ChapterRubiks } from "@/components/life/ChapterRubiks";
import { ChapterMUN } from "@/components/life/ChapterMUN";
import { ChapterAnchoring } from "@/components/life/ChapterAnchoring";
import { ChapterMoving } from "@/components/life/ChapterMoving";
import { ChapterStartups } from "@/components/life/ChapterStartups";
import { ChapterFitness } from "@/components/life/ChapterFitness";
import { ChapterJEE } from "@/components/life/ChapterJEE";
import { ChapterHackathons } from "@/components/life/ChapterHackathons";
import { ChapterTransition } from "@/components/life/ChapterTransition";
import { ChapterEnding } from "@/components/life/ChapterEnding";
import { CurrentChapter } from "@/components/life/CurrentChapter";
import { LifeNav } from "@/components/life/LifeNav";
import { LifeTimeline } from "@/components/life/LifeTimeline";

export const metadata: Metadata = {
  title: "Josh / Life",
  description: "Not a résumé. Just the receipts.",
};

export default function LifePage() {
  return (
    <main className="relative w-full bg-bg text-fg min-h-screen overflow-x-hidden">
      <LifeNav />
      <LifeTimeline />
      <LifeHero />
      
      <div className="relative w-full flex flex-col items-center">
        <ChapterRollerSkating />
        
        <ChapterTransition 
          lines={["I KEPT CHASING", "THE NEXT THING."]}
          finalLine="THE NEXT OBSESSION:" 
        />
        <ChapterYoga />

        <ChapterTransition 
          lines={["THEN I WANTED TO SEE", "HOW FAR I COULD TAKE IT."]}
          finalLine="THE NEXT OBSESSION:" 
        />
        <ChapterSocial />

        <ChapterTransition 
          lines={["I FOUND ANOTHER", "RABBIT HOLE."]}
          finalLine="THE NEXT OBSESSION:" 
        />
        <ChapterMinecraft />

        <ChapterTransition 
          lines={["I KEEP FINDING", "NEW WAYS TO SOLVE THINGS."]}
          finalLine="THE NEXT OBSESSION:" 
        />
        <ChapterRubiks />

        <ChapterTransition 
          lines={["THEN I REALIZED", "WORDS MATTER TOO."]}
          finalLine="THE NEXT OBSESSION:" 
        />
        <ChapterMUN />
        <ChapterAnchoring />

        <ChapterTransition 
          lines={["SOMETIMES", "YOU JUST HAVE TO MOVE."]}
        />
        <ChapterMoving />

        <ChapterTransition 
          lines={["THEN I STOPPED", "JUST TRYING THINGS."]}
          finalLine="THE NEXT OBSESSION:" 
        />
        <ChapterStartups />
        
        <ChapterTransition 
          lines={["THE MIND WAS SHARP.", "BUT THE BODY NEEDED WORK."]}
          finalLine="THE NEXT OBSESSION:" 
        />
        <ChapterFitness />

        <ChapterTransition 
          lines={["AND THEN", "I HIT A WALL."]}
        />
        <ChapterJEE />

        <ChapterTransition 
          lines={["SO I WENT BACK", "TO WHAT I DO BEST."]}
          finalLine="THE NEXT OBSESSION:" 
        />
        <ChapterHackathons />

        <ChapterTransition 
          lines={["WHICH BRINGS US", "TO RIGHT NOW."]}
        />
        <CurrentChapter />

        <ChapterEnding />
      </div>
    </main>
  );
}
EOF
cat << 'EOF' > app/life/page.tsx
import { Metadata } from "next";
import { LifeHero } from "@/components/life/LifeHero";
import { ChapterSports } from "@/components/life/ChapterSports";
import { ChapterSocial } from "@/components/life/ChapterSocial";
import { ChapterMinecraft } from "@/components/life/ChapterMinecraft";
import { ChapterRubiks } from "@/components/life/ChapterRubiks";
import { ChapterMUN } from "@/components/life/ChapterMUN";
import { ChapterAnchoring } from "@/components/life/ChapterAnchoring";
import { ChapterMoving } from "@/components/life/ChapterMoving";
import { ChapterStartups } from "@/components/life/ChapterStartups";
import { ChapterFitness } from "@/components/life/ChapterFitness";
import { ChapterJEE } from "@/components/life/ChapterJEE";
import { ChapterHackathons } from "@/components/life/ChapterHackathons";
import { PatternTransition } from "@/components/life/PatternTransition";
import { CoreValues } from "@/components/life/CoreValues";
import { CurrentChapter } from "@/components/life/CurrentChapter";
import { FutureChapter } from "@/components/life/FutureChapter";
import { LifeNav } from "@/components/life/LifeNav";
import { LifeTimeline } from "@/components/life/LifeTimeline";
import { HorizontalScrollGroup } from "@/components/life/HorizontalScrollGroup";

export const metadata: Metadata = {
  title: "Josh / Life",
  description: "Not a résumé. Just the receipts.",
};

export default function LifePage() {
  return (
    <main className="relative w-full bg-bg text-fg min-h-screen">
      <LifeNav />
      <LifeTimeline />
      <LifeHero />
      
      <div className="relative w-full flex flex-col items-center">
        <HorizontalScrollGroup numPanels={3}>
          <ChapterSports />
          <ChapterSocial />
          <ChapterMinecraft />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={3}>
          <ChapterRubiks />
          <ChapterMUN />
          <ChapterAnchoring />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={5}>
          <ChapterMoving />
          <ChapterStartups />
          <ChapterFitness />
          <ChapterJEE />
          <ChapterHackathons />
        </HorizontalScrollGroup>
      </div>

      <PatternTransition />
      <CoreValues />
      <CurrentChapter />
      <FutureChapter />
    </main>
  );
}
EOF
cat << 'EOF' > components/life/ChapterSports.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

const sports = [
  { name: "ROLLER SKATING", level: "STATE LEVEL" },
  { name: "YOGA", level: "STATE LEVEL" },
  { name: "FOOTBALL", level: "PROFICIENT" },
  { name: "BADMINTON", level: "PROFICIENT" },
  { name: "VOLLEYBALL", level: "PROFICIENT" },
  { name: "RUNNING", level: "PROFICIENT" }
];

export function ChapterSports() {
  return (
    <LifeChapter year="14" label="COMPETING">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.h2 
          initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-bold tracking-tighter uppercase"
          style={{ color: "#FF5722" }}
        >
          I TRIED TO<br />GO PRO.
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8 w-full">
          {sports.map((sport, idx) => (
            <motion.div 
              key={sport.name}
              initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + (idx * 0.1) }}
              className="flex flex-col gap-2 border-l-[3px] pl-4 md:pl-6"
              style={{ borderColor: "#FF5722" }}
            >
              <h3 className="text-xl md:text-3xl font-bold">{sport.name}</h3>
              <p className="font-mono text-xs md:text-sm text-fg-soft tracking-widest uppercase">{sport.level}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="w-full mt-8"
        >
          <div 
            className="inline-block px-6 py-4 font-mono text-sm md:text-base font-bold uppercase tracking-widest text-[#111]"
            style={{ backgroundColor: "#FF5722" }}
          >
            20–25 MEDALS
          </div>
          <p className="mt-8 text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed">
            I tried to go pro. I reached state level. I won medals. Played them and became proficient in every one of those but never pursued them. Then life moved in another direction.
          </p>
        </motion.div>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > components/life/ChapterTransition.tsx
"use client";

import { motion } from "framer-motion";

interface ChapterTransitionProps {
  lines: string[];
  finalLine?: string;
  nextChapter?: string;
}

export function ChapterTransition({ lines, finalLine, nextChapter }: ChapterTransitionProps) {
  return (
    <section className="relative w-screen h-screen shrink-0 flex flex-col items-center justify-center bg-bg px-6">
      <div className="flex flex-col items-center justify-center gap-16 text-center max-w-4xl">
        <div className="flex flex-col gap-4">
          {lines.map((line, idx) => (
            <motion.h2 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 0.8, delay: idx * 1.5 }}
              className="text-2xl md:text-5xl font-bold tracking-tighter uppercase text-fg-soft"
            >
              {line}
            </motion.h2>
          ))}
        </div>
        
        {finalLine && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 1, delay: lines.length * 1.5 + 1 }}
            className="flex flex-col gap-4 mt-12"
          >
            <h1 className="text-xl md:text-2xl font-mono tracking-[0.2em] uppercase text-fg-soft">
              {finalLine}
            </h1>
            {nextChapter && (
              <h1 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase text-accent">
                {nextChapter}
              </h1>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
EOF
cat << 'EOF' > app/life/page.tsx
import { Metadata } from "next";
import { LifeHero } from "@/components/life/LifeHero";
import { ChapterRollerSkating } from "@/components/life/ChapterRollerSkating";
import { ChapterYoga } from "@/components/life/ChapterYoga";
import { ChapterTransition } from "@/components/life/ChapterTransition";
import { ChapterSocial } from "@/components/life/ChapterSocial";
import { ChapterMinecraft } from "@/components/life/ChapterMinecraft";
import { ChapterRubiks } from "@/components/life/ChapterRubiks";
import { ChapterMUN } from "@/components/life/ChapterMUN";
import { ChapterAnchoring } from "@/components/life/ChapterAnchoring";
import { ChapterMoving } from "@/components/life/ChapterMoving";
import { ChapterStartups } from "@/components/life/ChapterStartups";
import { ChapterFitness } from "@/components/life/ChapterFitness";
import { ChapterJEE } from "@/components/life/ChapterJEE";
import { ChapterHackathons } from "@/components/life/ChapterHackathons";
import { PatternTransition } from "@/components/life/PatternTransition";
import { CoreValues } from "@/components/life/CoreValues";
import { CurrentChapter } from "@/components/life/CurrentChapter";
import { FutureChapter } from "@/components/life/FutureChapter";
import { LifeNav } from "@/components/life/LifeNav";
import { LifeTimeline } from "@/components/life/LifeTimeline";
import { HorizontalScrollGroup } from "@/components/life/HorizontalScrollGroup";

export const metadata: Metadata = {
  title: "Josh / Life",
  description: "Not a résumé. Just the receipts.",
};

export default function LifePage() {
  return (
    <main className="relative w-full bg-bg text-fg min-h-screen">
      <LifeNav />
      <LifeTimeline />
      <LifeHero />
      
      <div className="relative w-full flex flex-col items-center">
        <HorizontalScrollGroup numPanels={5}>
          <ChapterRollerSkating />
          <ChapterTransition 
            lines={["I KEPT CHASING", "THE NEXT THING."]}
            finalLine="THE NEXT OBSESSION:"
            nextChapter="YOGA"
          />
          <ChapterYoga />
          <ChapterSocial />
          <ChapterMinecraft />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={3}>
          <ChapterRubiks />
          <ChapterMUN />
          <ChapterAnchoring />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={5}>
          <ChapterMoving />
          <ChapterStartups />
          <ChapterFitness />
          <ChapterJEE />
          <ChapterHackathons />
        </HorizontalScrollGroup>
      </div>

      <PatternTransition />
      <CoreValues />
      <CurrentChapter />
      <FutureChapter />
    </main>
  );
}
EOF
git checkout components/life/ChapterSocial.tsx components/life/ChapterMinecraft.tsx components/life/ChapterRubiks.tsx components/life/ChapterMUN.tsx components/life/ChapterAnchoring.tsx components/life/ChapterMoving.tsx components/life/ChapterStartups.tsx components/life/ChapterFitness.tsx components/life/ChapterJEE.tsx components/life/ChapterHackathons.tsx components/life/CurrentChapter.tsx
rm -f .git/index.lock && git checkout components/life/ChapterSocial.tsx components/life/ChapterMinecraft.tsx components/life/ChapterRubiks.tsx components/life/ChapterMUN.tsx components/life/ChapterAnchoring.tsx components/life/ChapterMoving.tsx components/life/ChapterStartups.tsx components/life/ChapterFitness.tsx components/life/ChapterJEE.tsx components/life/ChapterHackathons.tsx components/life/CurrentChapter.tsx
cat << 'EOF' > app/life/page.tsx
import { Metadata } from "next";
import { LifeHero } from "@/components/life/LifeHero";
import { ChapterRollerSkating } from "@/components/life/ChapterRollerSkating";
import { ChapterYoga } from "@/components/life/ChapterYoga";
import { ChapterTransition } from "@/components/life/ChapterTransition";
import { ChapterSocial } from "@/components/life/ChapterSocial";
import { ChapterMinecraft } from "@/components/life/ChapterMinecraft";
import { ChapterRubiks } from "@/components/life/ChapterRubiks";
import { ChapterMUN } from "@/components/life/ChapterMUN";
import { ChapterAnchoring } from "@/components/life/ChapterAnchoring";
import { ChapterMoving } from "@/components/life/ChapterMoving";
import { ChapterStartups } from "@/components/life/ChapterStartups";
import { ChapterFitness } from "@/components/life/ChapterFitness";
import { ChapterJEE } from "@/components/life/ChapterJEE";
import { ChapterHackathons } from "@/components/life/ChapterHackathons";
import { PatternTransition } from "@/components/life/PatternTransition";
import { CoreValues } from "@/components/life/CoreValues";
import { CurrentChapter } from "@/components/life/CurrentChapter";
import { FutureChapter } from "@/components/life/FutureChapter";
import { LifeNav } from "@/components/life/LifeNav";
import { LifeTimeline } from "@/components/life/LifeTimeline";
import { HorizontalScrollGroup } from "@/components/life/HorizontalScrollGroup";

export const metadata: Metadata = {
  title: "Josh / Life",
  description: "Not a résumé. Just the receipts.",
};

export default function LifePage() {
  return (
    <main className="relative w-full bg-bg text-fg min-h-screen">
      <LifeNav />
      <LifeTimeline />
      <LifeHero />
      
      <div className="relative w-full flex flex-col items-center">
        {/* SPORTS SECTION SPLIT */}
        <HorizontalScrollGroup numPanels={3}>
          <ChapterRollerSkating />
          <ChapterTransition 
            lines={["I KEPT CHASING", "THE NEXT THING."]}
            finalLine="THE NEXT OBSESSION:"
            nextChapter="YOGA"
          />
          <ChapterYoga />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={2}>
          <ChapterSocial />
          <ChapterMinecraft />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={3}>
          <ChapterRubiks />
          <ChapterMUN />
          <ChapterAnchoring />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={5}>
          <ChapterMoving />
          <ChapterStartups />
          <ChapterFitness />
          <ChapterJEE />
          <ChapterHackathons />
        </HorizontalScrollGroup>
      </div>

      <PatternTransition />
      <CoreValues />
      <CurrentChapter />
      <FutureChapter />
    </main>
  );
}
EOF
cat components/life/ChapterTransition.tsx
cat << 'EOF' > components/life/ChapterSports.tsx
"use client";

import { motion } from "framer-motion";
import { LifeChapter } from "./LifeChapter";

const sports = [
  { name: "ROLLER SKATING", level: "STATE LEVEL" },
  { name: "YOGA", level: "STATE LEVEL" },
  { name: "FOOTBALL", level: "PROFICIENT" },
  { name: "BADMINTON", level: "PROFICIENT" },
  { name: "VOLLEYBALL", level: "PROFICIENT" },
  { name: "RUNNING", level: "PROFICIENT" }
];

export function ChapterSports() {
  return (
    <LifeChapter year="14" label="COMPETING">
      <div className="w-full flex flex-col gap-12 md:gap-16 items-start">
        <motion.h2 
          initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-bold tracking-tighter uppercase"
          style={{ color: "#FF5722" }}
        >
          I TRIED TO<br />GO PRO.
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8 w-full">
          {sports.map((sport, idx) => (
            <motion.div 
              key={sport.name}
              initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + (idx * 0.1) }}
              className="flex flex-col gap-2 border-l-[3px] pl-4 md:pl-6"
              style={{ borderColor: "#FF5722" }}
            >
              <h3 className="text-xl md:text-3xl font-bold">{sport.name}</h3>
              <p className="font-mono text-xs md:text-sm text-fg-soft tracking-widest uppercase">{sport.level}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="w-full mt-8"
        >
          <div 
            className="inline-block px-6 py-4 font-mono text-sm md:text-base font-bold uppercase tracking-widest text-[#111]"
            style={{ backgroundColor: "#FF5722" }}
          >
            20–25 MEDALS
          </div>
          <p className="mt-8 text-xl md:text-2xl text-fg-soft max-w-2xl leading-relaxed">
            I tried to go pro. I reached state level. I won medals. Played them and became proficient in every one of those but never pursued them. Then life moved in another direction.
          </p>
        </motion.div>
      </div>
    </LifeChapter>
  );
}
EOF
cat << 'EOF' > app/life/page.tsx
import { Metadata } from "next";
import { LifeHero } from "@/components/life/LifeHero";
import { ChapterSports } from "@/components/life/ChapterSports";
import { ChapterSocial } from "@/components/life/ChapterSocial";
import { ChapterMinecraft } from "@/components/life/ChapterMinecraft";
import { ChapterRubiks } from "@/components/life/ChapterRubiks";
import { ChapterMUN } from "@/components/life/ChapterMUN";
import { ChapterAnchoring } from "@/components/life/ChapterAnchoring";
import { ChapterMoving } from "@/components/life/ChapterMoving";
import { ChapterStartups } from "@/components/life/ChapterStartups";
import { ChapterFitness } from "@/components/life/ChapterFitness";
import { ChapterJEE } from "@/components/life/ChapterJEE";
import { ChapterHackathons } from "@/components/life/ChapterHackathons";
import { PatternTransition } from "@/components/life/PatternTransition";
import { CoreValues } from "@/components/life/CoreValues";
import { CurrentChapter } from "@/components/life/CurrentChapter";
import { FutureChapter } from "@/components/life/FutureChapter";
import { LifeNav } from "@/components/life/LifeNav";
import { LifeTimeline } from "@/components/life/LifeTimeline";
import { HorizontalScrollGroup } from "@/components/life/HorizontalScrollGroup";

export const metadata: Metadata = {
  title: "Josh / Life",
  description: "Not a résumé. Just the receipts.",
};

export default function LifePage() {
  return (
    <main className="relative w-full bg-bg text-fg min-h-screen">
      <LifeNav />
      <LifeTimeline />
      <LifeHero />
      
      <div className="relative w-full flex flex-col items-center">
        <HorizontalScrollGroup numPanels={3}>
          <ChapterSports />
          <ChapterSocial />
          <ChapterMinecraft />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={3}>
          <ChapterRubiks />
          <ChapterMUN />
          <ChapterAnchoring />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={5}>
          <ChapterMoving />
          <ChapterStartups />
          <ChapterFitness />
          <ChapterJEE />
          <ChapterHackathons />
        </HorizontalScrollGroup>
      </div>

      <PatternTransition />
      <CoreValues />
      <CurrentChapter />
      <FutureChapter />
    </main>
  );
}
EOF
grep -n "cat << 'EOF' > components/life/ChapterSocial.tsx" /Users/josh/.gemini/antigravity/brain/d3707720-b31f-4bad-9806-6053c097ff81/.system_generated/logs/transcript_full.jsonl
jq -r 'select(.tool_calls != null) | .tool_calls[] | select(.name == "run_command" and (.args.CommandLine | contains("components/life/Chapter"))) | .args.CommandLine' /Users/josh/.gemini/antigravity/brain/d3707720-b31f-4bad-9806-6053c097ff81/.system_generated/logs/transcript_full.jsonl > restore_all.sh
