"use client";

import { motion } from "framer-motion";

/**
 * Route-level page transition.
 * Re-mounts on every navigation so the entire route content fades + lifts in.
 * Combined with smooth scroll + scroll progress bar, gives the site a continuous "app-like" feel.
 *
 * Kept short and filter-free: a blur held every new page unreadable for its first
 * frames, and its leftover `filter: blur(0px)` kept the whole page in an offscreen
 * compositing layer for as long as you stayed on it.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
