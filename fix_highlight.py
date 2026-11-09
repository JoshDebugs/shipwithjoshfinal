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
      {segments.map((segment, segIdx) => {
        return (
          <span key={segIdx}>
            {segment.text.split("").map((char, i) => {
              const charStart = typeStart + (globalIndex / totalChars) * (typeEnd - typeStart);
              const charEnd = charStart + 0.01;
              globalIndex++;
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const opacity = useTransform(progress, [charStart, charEnd], [0, 1]);
              
              let charClass = segment.className || "";
              
              // If it's a background highlight, we might want padding on first/last char
              if (charClass.includes("bg-")) {
                charClass = charClass.replace("px-2", ""); // remove full padding
                if (i === 0) charClass += " pl-2 rounded-l-sm";
                if (i === segment.text.length - 1) charClass += " pr-2 rounded-r-sm";
                charClass += " py-1"; // apply vertical padding to all
              }
              
              return (
                <motion.span key={`${segIdx}-${i}`} style={{ opacity }} className={charClass}>
                  {char}
                </motion.span>
              );
            })}
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

with open('components/life/LifeHero.tsx', 'w') as f:
    f.write(content)
