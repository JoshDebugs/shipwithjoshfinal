import re

with open('components/life/LifeHero.tsx', 'r') as f:
    content = f.read()

typewriter_component = """type Segment = { 
  text: string; 
  textClassName?: string;
  bgClassName?: string;
};

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
      {segments.map((segment, segIdx) => {
        const segLen = segment.text.length;
        const segmentStart = typeStart + (globalIndex / totalChars) * (typeEnd - typeStart);
        const segmentEnd = typeStart + ((globalIndex + segLen) / totalChars) * (typeEnd - typeStart);
        
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const bgWidth = useTransform(progress, [segmentStart, segmentEnd], ["0%", "100%"]);
        
        const hasBg = !!segment.bgClassName;
        
        return (
          <span 
            key={segIdx} 
            className={hasBg ? "relative inline-block whitespace-nowrap" : ""}
          >
            {hasBg && (
              <motion.span 
                className={`absolute top-0 bottom-0 left-0 -z-10 ${segment.bgClassName}`}
                style={{ width: bgWidth }}
              />
            )}
            
            <span className={hasBg ? `relative z-10 ${segment.textClassName || ""}` : (segment.textClassName || "")}>
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
          </span>
        );
      })}
    </span>
  );
}"""

content = re.sub(
    r'type Segment = .*?(?=export function LifeHero)',
    typewriter_component + '\n\n',
    content,
    flags=re.DOTALL
)

p1_replace = """<ScrollTypewriter 
                progress={scrollProgress} 
                segments={[
                  { text: "I've tried a lot of different things, some " },
                  { text: "stuck", textClassName: "text-fg underline decoration-white decoration-[3px] underline-offset-[6px]" },
                  { text: " and " },
                  { text: "some didn't.", textClassName: "text-bg px-2 py-1", bgClassName: "bg-fg rounded-sm" }
                ]}
                typeStart={0.35} 
                typeEnd={0.55} 
              />"""

content = re.sub(
    r'<ScrollTypewriter\s+progress={scrollProgress}\s+segments={\[.*?\]}\s+typeStart={0.35}\s+typeEnd={0.55}\s+/>',
    p1_replace,
    content,
    flags=re.DOTALL
)

with open('components/life/LifeHero.tsx', 'w') as f:
    f.write(content)
