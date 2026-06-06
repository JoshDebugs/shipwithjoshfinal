"use client";

import { motion } from "framer-motion";

/**
 * Route-level page transition.
 * Re-mounts on every navigation so the entire route content fades + lifts in.
 * Combined with smooth scroll + scroll progress bar, gives the site a continuous "app-like" feel.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
