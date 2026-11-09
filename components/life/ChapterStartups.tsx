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
