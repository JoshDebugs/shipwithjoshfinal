import re

with open('components/life/LifeHero.tsx', 'r') as f:
    content = f.read()

typewriter_component = """function ScrollTypewriter({ progress, text, startIndex, totalChars, className }: { progress: MotionValue<number>, text: string, startIndex: number, totalChars: number, className?: string }) {
  return (
    <span className={className}>
      {text.split("").map((char, i) => {
        const globalIndex = startIndex + i;
        const typeStart = 0.27 + (globalIndex / totalChars) * 0.24;
        const typeEnd = typeStart + 0.01;
        
        const scatterStart = 0.65;
        const scatterEnd = 0.85;
        
        const randX = Math.sin(globalIndex * 12.9898) * 400;
        const randY = Math.cos(globalIndex * 78.233) * 400;
        const randRot = Math.sin(globalIndex * 45.123) * 360;

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const opacity = useTransform(progress, 
          [typeStart, typeEnd, scatterStart, scatterEnd], 
          [0, 1, 1, 0]
        );
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const x = useTransform(progress, [scatterStart, scatterEnd], [0, randX]);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const y = useTransform(progress, [scatterStart, scatterEnd], [0, randY]);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const rotate = useTransform(progress, [scatterStart, scatterEnd], [0, randRot]);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const scale = useTransform(progress, [scatterStart, scatterEnd], [1, 0]);

        return (
          <motion.span key={i} style={{ opacity, x, y, rotate, scale, display: "inline-block", whiteSpace: "pre" }}>
            {char}
          </motion.span>
        );
      })}
    </span>
  );
}"""

# Replace the old ScrollTypewriter
content = re.sub(
    r'function ScrollTypewriter.*?(?=export function LifeHero)',
    typewriter_component + '\n\n',
    content,
    flags=re.DOTALL
)

with open('components/life/LifeHero.tsx', 'w') as f:
    f.write(content)
