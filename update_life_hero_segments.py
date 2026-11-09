import re

with open('components/life/LifeHero.tsx', 'r') as f:
    content = f.read()

typewriter_component = """type Segment = { text: string; className?: string };

function ScrollTypewriter({ 
  progress, 
  segments, 
  typeStart, 
  typeEnd, 
  className 
}: { 
  progress: MotionValue<number>, 
  segments: Segment[], 
  typeStart: number,
  typeEnd: number,
  className?: string 
}) {
  const fullText = segments.map(s => s.text).join("");
  const totalChars = fullText.length;
  
  let globalIndex = 0;
  
  return (
    <span className={className}>
      {segments.map((segment, segIdx) => (
        <span key={segIdx} className={segment.className}>
          {segment.text.split("").map((char, i) => {
            const charStart = typeStart + (globalIndex / totalChars) * (typeEnd - typeStart);
            const charEnd = charStart + 0.01;
            globalIndex++;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const opacity = useTransform(progress, [charStart, charEnd], [0, 1]);
            return (
              <motion.span key={`${segIdx}-${i}`} style={{ opacity }}>
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </span>
  );
}"""

content = re.sub(
    r'function ScrollTypewriter.*?(?=export function LifeHero)',
    typewriter_component + '\n\n',
    content,
    flags=re.DOTALL
)

p1_replace = """<ScrollTypewriter 
                progress={scrollProgress} 
                segments={[
                  { text: "I've tried a lot of different things, some " },
                  { text: "stuck", className: "text-fg underline decoration-white decoration-[3px] underline-offset-[6px]" },
                  { text: " and " },
                  { text: "some didn't.", className: "bg-fg text-bg px-2 rounded-sm" }
                ]}
                typeStart={0.35} 
                typeEnd={0.55} 
              />"""

content = re.sub(
    r'<ScrollTypewriter\s+progress={scrollProgress}\s+text="I\'ve tried a lot of different things, some stuck and some didn\'t."\s+typeStart={0.35}\s+typeEnd={0.55}\s+/>',
    p1_replace,
    content,
    flags=re.DOTALL
)

p2_replace = """<ScrollTypewriter 
                progress={scrollProgress} 
                segments={[{ text: "Here's the gist of it." }]}
                typeStart={0.7} 
                typeEnd={0.85} 
              />"""

content = re.sub(
    r'<ScrollTypewriter\s+progress={scrollProgress}\s+text="Here\'s the gist of it."\s+typeStart={0.7}\s+typeEnd={0.85}\s+/>',
    p2_replace,
    content,
    flags=re.DOTALL
)


with open('components/life/LifeHero.tsx', 'w') as f:
    f.write(content)
