import re

with open('components/life/LifeHero.tsx', 'r') as f:
    content = f.read()

# Replace height
content = content.replace('h-[400vh]', 'h-[300vh]')

transforms = """  const heroOpacity = useTransform(scrollProgress, [0, 0.2, 0.3], [1, 1, 0]);
  const heroScale = useTransform(scrollProgress, [0, 0.2, 0.3], [1, 1, 0.95]);
  const introOpacity = useTransform(scrollProgress, [0.2, 0.3, 1], [0, 1, 1]);

  const p1Opacity = useTransform(scrollProgress, [0.3, 0.35, 0.6, 0.65], [0, 1, 1, 0]);
  const p1Scale = useTransform(scrollProgress, [0.3, 0.65], [1.1, 1]);
  const p1Filter = useTransform(scrollProgress, [0.3, 0.4], ["blur(10px)", "blur(0px)"]);

  const p2Opacity = useTransform(scrollProgress, [0.65, 0.7, 1, 1], [0, 1, 1, 1]);
  const p2Scale = useTransform(scrollProgress, [0.65, 1], [1.1, 1]);
  const p2Filter = useTransform(scrollProgress, [0.65, 0.75], ["blur(10px)", "blur(0px)"]);"""

content = re.sub(
    r'  const heroOpacity = useTransform.*?const p3Filter = useTransform.*?;',
    transforms,
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
                text="I've tried a lot of different things, some stuck and some didn't." 
                typeStart={0.35} 
                typeEnd={0.55} 
              />
            </h2>
          </motion.div>

          {/* Phrase 2 */}
          <motion.div 
            style={{ opacity: p2Opacity, scale: p2Scale, filter: p2Filter }}
            className="absolute inset-0 flex items-center justify-center px-6 md:px-12"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-sans tracking-tight leading-tight font-medium text-center max-w-4xl text-fg">
              <ScrollTypewriter 
                progress={scrollProgress} 
                text="Here's the gist of it." 
                typeStart={0.7} 
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
