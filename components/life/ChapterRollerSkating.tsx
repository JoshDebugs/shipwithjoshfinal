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
