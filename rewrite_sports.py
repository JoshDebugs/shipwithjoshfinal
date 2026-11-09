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
