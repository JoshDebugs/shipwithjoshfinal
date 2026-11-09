with open('components/life/LifeHero.tsx', 'r') as f:
    content = f.read()

import re

# Revert height
content = content.replace('h-[350vh]', 'h-[250vh]')

# Revert timings
content = content.replace(
    'const heroOpacity = useTransform(scrollProgress, [0, 0.24, 0.36], [1, 1, 0]);',
    'const heroOpacity = useTransform(scrollProgress, [0, 0.4, 0.6], [1, 1, 0]);'
)

content = content.replace(
    'const heroScale = useTransform(scrollProgress, [0, 0.24, 0.36], [1, 1, 0.95]);',
    'const heroScale = useTransform(scrollProgress, [0, 0.4, 0.6], [1, 1, 0.95]);'
)

content = content.replace(
    'const introOpacity = useTransform(scrollProgress, [0.24, 0.3, 1], [0, 1, 1]);',
    'const introOpacity = useTransform(scrollProgress, [0.4, 0.5, 1], [0, 1, 1]);'
)

content = content.replace(
    'const introScale = useTransform(scrollProgress, [0.3, 0.42, 1], [1.1, 1, 1]);',
    'const introScale = useTransform(scrollProgress, [0.5, 0.7, 1], [1.1, 1, 1]);'
)

content = content.replace(
    'const introFilter = useTransform(scrollProgress, [0.3, 0.42], ["blur(10px)", "blur(0px)"]);',
    'const introFilter = useTransform(scrollProgress, [0.5, 0.7], ["blur(10px)", "blur(0px)"]);'
)

typewriter_revert = """function ScrollTypewriter({ progress, text, startIndex, totalChars, className }: { progress: MotionValue<number>, text: string, startIndex: number, totalChars: number, className?: string }) {
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
}"""

content = re.sub(
    r'function ScrollTypewriter.*?(?=export function LifeHero)',
    typewriter_revert + '\n\n',
    content,
    flags=re.DOTALL
)

with open('components/life/LifeHero.tsx', 'w') as f:
    f.write(content)
