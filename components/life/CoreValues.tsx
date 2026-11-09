"use client";

import { motion } from "framer-motion";

const VALUES = [
  { title: "CURIOSITY", desc: "I like learning how different worlds work." },
  { title: "OBSESSION", desc: "When something grabs me, I go deep." },
  { title: "EXPERIMENTATION", desc: "I'd rather try than wonder." },
  { title: "ADAPTABILITY", desc: "I've had to restart more than once." },
  { title: "BUILDING", desc: "Eventually, I stopped only consuming and started making." },
];

export function CoreValues() {
  return (
    <section className="relative w-full py-48 px-6 md:px-12 bg-bg flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-32">
        {VALUES.map((val, i) => (
          <motion.div 
            key={val.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <h3 className="text-4xl md:text-6xl font-mono font-bold tracking-tighter uppercase">
              {val.title}
            </h3>
            <p className="text-xl md:text-3xl text-fg-soft font-medium tracking-tight border-l-4 border-accent pl-6">
              {val.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
