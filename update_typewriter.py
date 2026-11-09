import re

with open('components/life/LifeHero.tsx', 'r') as f:
    content = f.read()

# Make sure MotionValue is imported
if 'MotionValue' not in content:
    content = content.replace(
        'import { motion, useMotionValue, useTransform } from "framer-motion";',
        'import { motion, useMotionValue, useTransform, MotionValue } from "framer-motion";'
    )

sub_component = """
function ScrollTypewriter({ progress, text, startIndex, totalChars, className }: { progress: MotionValue<number>, text: string, startIndex: number, totalChars: number, className?: string }) {
  return (
    <span className={className}>
      {text.split("").map((char, i) => {
        const globalIndex = startIndex + i;
        const start = 0.45 + (globalIndex / totalChars) * 0.4;
        const end = start + 0.01; // almost instant appearance for typewriter feel
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const opacity = useTransform(progress, [start, end], [0, 1]);
        return (
          <motion.span key={i} style={{ opacity }}>
            {char}
          </motion.span>
        );
      })}
    </span>
  );
}

export function LifeHero() {
"""

content = content.replace('export function LifeHero() {', sub_component)

intro_overlay = """        {/* Intro Transition Overlay */}
        <motion.div 
          style={{ scale: introScale, filter: introFilter }}
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none px-6 md:px-12 bg-bg"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-sans tracking-tight leading-tight font-medium text-center max-w-4xl">
            <ScrollTypewriter 
              progress={scrollProgress} 
              text="I've tried a lot of different things." 
              startIndex={0} 
              totalChars={60} 
              className="text-fg-soft"
            />
            <br className="hidden md:block" />
            <ScrollTypewriter 
              progress={scrollProgress} 
              text=" Here's the gist of it." 
              startIndex={37} 
              totalChars={60} 
              className="text-fg"
            />
          </h2>
        </motion.div>"""

# Regex replace the Intro Transition Overlay block
import re
content = re.sub(
    r'\{\/\* Intro Transition Overlay \*\/\}.*?<\/h2>\s*<\/motion\.div>',
    intro_overlay,
    content,
    flags=re.DOTALL
)

with open('components/life/LifeHero.tsx', 'w') as f:
    f.write(content)
