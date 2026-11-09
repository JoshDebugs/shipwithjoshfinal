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
