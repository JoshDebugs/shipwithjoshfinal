import re

with open('components/life/LifeHero.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace(
    'import { motion } from "framer-motion";',
    'import { motion, useMotionValue, useTransform } from "framer-motion";\nimport { useLenis } from "lenis/react";'
)

# Add hooks
hooks_addition = """
  const sectionRef = useRef<HTMLElement>(null);
  const scrollProgress = useMotionValue(0);

  useLenis(() => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const startScroll = -rect.top;
    const maxScroll = rect.height - window.innerHeight;
    if (maxScroll > 0) {
      let progress = startScroll / maxScroll;
      progress = Math.max(0, Math.min(1, progress));
      scrollProgress.set(progress);
    }
  });

  const heroOpacity = useTransform(scrollProgress, [0, 0.4, 0.6], [1, 1, 0]);
  const heroScale = useTransform(scrollProgress, [0, 0.4, 0.6], [1, 1, 0.95]);
  const introOpacity = useTransform(scrollProgress, [0.5, 0.7, 1], [0, 1, 1]);
  const introScale = useTransform(scrollProgress, [0.5, 0.7, 1], [1.1, 1, 1]);
  const introFilter = useTransform(scrollProgress, [0.5, 0.7], ["blur(10px)", "blur(0px)"]);
"""

content = content.replace(
    'const constraintsRef = useRef(null);',
    'const constraintsRef = useRef(null);\n' + hooks_addition
)

# Replace section start
content = content.replace(
    '<section ref={constraintsRef} className="relative w-full min-h-[100dvh] flex flex-col justify-between p-6 md:p-12 bg-bg overflow-hidden">',
    """<section ref={sectionRef} className="relative w-full h-[250vh]">
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-bg">
        
        {/* Intro Transition Overlay */}
        <motion.div 
          style={{ opacity: introOpacity, scale: introScale, filter: introFilter }}
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none px-6 md:px-12 bg-bg"
        >
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-sans tracking-tight leading-tight text-fg-soft font-medium text-center max-w-4xl">
            I've tried a lot of different things.
            <br className="hidden md:block" />
            <span className="text-fg"> Here's the gist of it.</span>
          </h2>
        </motion.div>

        {/* Original Hero Content */}
        <motion.div 
          ref={constraintsRef} 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative w-full h-full flex flex-col justify-between p-6 md:p-12"
        >"""
)

# Replace section end
content = content.replace(
    '</section>',
    '        </motion.div>\n      </div>\n    </section>'
)

with open('components/life/LifeHero.tsx', 'w') as f:
    f.write(content)
