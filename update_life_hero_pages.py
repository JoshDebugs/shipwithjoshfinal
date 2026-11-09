import re

with open('components/life/LifeHero.tsx', 'r') as f:
    content = f.read()

typewriter_component = """function ScrollTypewriter({ 
  progress, 
  text, 
  typeStart, 
  typeEnd, 
  className 
}: { 
  progress: MotionValue<number>, 
  text: string, 
  typeStart: number,
  typeEnd: number,
  className?: string 
}) {
  const totalChars = text.length;
  return (
    <span className={className}>
      {text.split("").map((char, i) => {
        const charStart = typeStart + (i / totalChars) * (typeEnd - typeStart);
        const charEnd = charStart + 0.01;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const opacity = useTransform(progress, [charStart, charEnd], [0, 1]);
        return (
          <motion.span key={i} style={{ opacity }}>
            {char}
          </motion.span>
        );
      })}
    </span>
  );
}"""

# Replace ScrollTypewriter
content = re.sub(
    r'function ScrollTypewriter.*?(?=export function LifeHero)',
    typewriter_component + '\n\n',
    content,
    flags=re.DOTALL
)

# Replace height
content = content.replace('h-[250vh]', 'h-[400vh]')

# Replace transforms
transforms = """
  const heroOpacity = useTransform(scrollProgress, [0, 0.15, 0.2], [1, 1, 0]);
  const heroScale = useTransform(scrollProgress, [0, 0.15, 0.2], [1, 1, 0.95]);
  const introOpacity = useTransform(scrollProgress, [0.15, 0.2, 1], [0, 1, 1]);

  const p1Opacity = useTransform(scrollProgress, [0.2, 0.25, 0.4, 0.45], [0, 1, 1, 0]);
  const p1Scale = useTransform(scrollProgress, [0.2, 0.45], [1.1, 1]);
  const p1Filter = useTransform(scrollProgress, [0.2, 0.3], ["blur(10px)", "blur(0px)"]);

  const p2Opacity = useTransform(scrollProgress, [0.45, 0.5, 0.65, 0.7], [0, 1, 1, 0]);
  const p2Scale = useTransform(scrollProgress, [0.45, 0.7], [1.1, 1]);
  const p2Filter = useTransform(scrollProgress, [0.45, 0.55], ["blur(10px)", "blur(0px)"]);

  const p3Opacity = useTransform(scrollProgress, [0.7, 0.75, 1, 1], [0, 1, 1, 1]);
  const p3Scale = useTransform(scrollProgress, [0.7, 1], [1.1, 1]);
  const p3Filter = useTransform(scrollProgress, [0.7, 0.8], ["blur(10px)", "blur(0px)"]);
"""

content = re.sub(
    r'  const heroOpacity = useTransform\(scrollProgress.*?(?=  const containerVars =)',
    transforms + '\n',
    content,
    flags=re.DOTALL
)

overlay = """        {/* Intro Transition Overlay */}
        <motion.div 
          style={{ opacity: introOpacity }}
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none px-6 md:px-12 bg-bg"
        >
          {/* Phrase 1 */}
          <motion.div 
            style={{ opacity: p1Opacity, scale: p1Scale, filter: p1Filter }}
            className="absolute inset-0 flex items-center justify-center px-6 md:px-12"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-sans tracking-tight leading-tight font-medium text-center max-w-4xl text-fg-soft">
              <ScrollTypewriter 
                progress={scrollProgress} 
                text="I've tried a lot of different things." 
                typeStart={0.25} 
                typeEnd={0.35} 
              />
            </h2>
          </motion.div>

          {/* Phrase 2 */}
          <motion.div 
            style={{ opacity: p2Opacity, scale: p2Scale, filter: p2Filter }}
            className="absolute inset-0 flex items-center justify-center px-6 md:px-12"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-sans tracking-tight leading-tight font-medium text-center max-w-4xl text-fg-soft">
              <ScrollTypewriter 
                progress={scrollProgress} 
                text="Some stuck and some didn't." 
                typeStart={0.5} 
                typeEnd={0.6} 
              />
            </h2>
          </motion.div>

          {/* Phrase 3 */}
          <motion.div 
            style={{ opacity: p3Opacity, scale: p3Scale, filter: p3Filter }}
            className="absolute inset-0 flex items-center justify-center px-6 md:px-12"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-sans tracking-tight leading-tight font-medium text-center max-w-4xl text-fg">
              <ScrollTypewriter 
                progress={scrollProgress} 
                text="Here's the gist of it." 
                typeStart={0.75} 
                typeEnd={0.85} 
              />
            </h2>
          </motion.div>
        </motion.div>"""

content = re.sub(
    r'        {/\* Intro Transition Overlay \*/}.*?(?=        {/\* Original Hero Content \*/})',
    overlay + '\n\n',
    content,
    flags=re.DOTALL
)

with open('components/life/LifeHero.tsx', 'w') as f:
    f.write(content)
