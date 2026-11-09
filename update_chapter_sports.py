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
