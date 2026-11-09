"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform, MotionValue } from "framer-motion";
import { useLenis } from "lenis/react";


type Segment = { 
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
}

export function LifeHero() {

  const constraintsRef = useRef(null);

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


  const heroOpacity = useTransform(scrollProgress, [0, 0.2, 0.3], [1, 1, 0]);
  const heroScale = useTransform(scrollProgress, [0, 0.2, 0.3], [1, 1, 0.95]);
  const introOpacity = useTransform(scrollProgress, [0.2, 0.3, 1], [0, 1, 1]);

  const p1Opacity = useTransform(scrollProgress, [0.3, 0.35, 0.6, 0.65], [0, 1, 1, 0]);
  const p1Scale = useTransform(scrollProgress, [0.3, 0.65], [1.1, 1]);
  const p1Filter = useTransform(scrollProgress, [0.3, 0.4], ["blur(10px)", "blur(0px)"]);

  const p2Opacity = useTransform(scrollProgress, [0.65, 0.7, 1, 1], [0, 1, 1, 1]);
  const p2Scale = useTransform(scrollProgress, [0.65, 1], [1.1, 1]);
  const p2Filter = useTransform(scrollProgress, [0.65, 0.75], ["blur(10px)", "blur(0px)"]);

  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.5 },
    },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    },
  };

  const largeTextVars = {
    hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
    show: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 70, damping: 20, delay: 1.2 }
    }
  };

  return (
    <section ref={sectionRef} className="relative w-full h-[300vh]">
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-bg">
        {/* Grid background — same pattern as the home hero */}
        <div className="grid-bg absolute inset-0 opacity-40 z-0" aria-hidden />
        
        {/* Intro Transition Overlay */}
        <motion.div 
          style={{ opacity: introOpacity }}
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none px-6 md:px-12 bg-bg/90"
        >
          {/* Phrase 1 */}
          <motion.div 
            style={{ opacity: p1Opacity, scale: p1Scale, filter: p1Filter }}
            className="absolute inset-0 flex items-center justify-center px-6 md:px-12 pb-[8vh]"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-sans tracking-tight leading-tight font-medium text-center max-w-4xl text-fg-soft">
              <ScrollTypewriter 
                progress={scrollProgress} 
                segments={[
                  { text: "I've tried a lot of different things, some " },
                  { text: "stuck", textClassName: "text-fg underline decoration-white decoration-[3px] underline-offset-[6px]" },
                  { text: " and " },
                  { text: "some didn't.", textClassName: "text-bg px-2 py-1", bgClassName: "bg-fg rounded-sm" }
                ]}
                typeStart={0.35} 
                typeEnd={0.55} 
              />
            </h2>
          </motion.div>

          {/* Phrase 2 */}
          <motion.div 
            style={{ opacity: p2Opacity, scale: p2Scale, filter: p2Filter }}
            className="absolute inset-0 flex items-center justify-center px-6 md:px-12 pb-[8vh]"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-sans tracking-tight leading-tight font-medium text-center max-w-4xl text-fg">
              <ScrollTypewriter 
                progress={scrollProgress} 
                segments={[{ text: "Here's the gist of it." }]}
                typeStart={0.7} 
                typeEnd={0.85} 
              />
            </h2>
          </motion.div>
        </motion.div>

        {/* Original Hero Content */}
        <motion.div 
          ref={constraintsRef} 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative w-full h-full flex flex-col justify-between p-6 md:p-12"
        >
      
      {/* Floating Geometric Shapes for Color Shift */}
      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden mix-blend-difference">
        
        {/* SVG Defs for Noise Texture */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <filter id="noiseFilter">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <pattern id="noisePattern" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="0.4" />
            </pattern>
          </defs>
        </svg>

        {/* Yellow Box */}
        <motion.div 
          drag
          dragConstraints={constraintsRef}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
          style={{ cursor: "grab" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: [0, 20, -10, 15, 0], 
            y: [0, -15, 20, -10, 0], 
            rotate: [-15, 5, -5, 10, -15] 
          }}
          transition={{ 
            opacity: { duration: 2, delay: 0.8 },
            scale: { duration: 2, delay: 0.8, type: "spring" },
            x: { duration: 15, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            y: { duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            rotate: { duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
          }}
          className="absolute top-[15%] left-[20%] md:left-[25%] w-[30vw] md:w-[20vw] h-[20vw] md:h-[12vw] bg-[#FFEB3B] pointer-events-auto border-[2px] border-white/40 drop-shadow-2xl overflow-hidden rounded-sm"
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay opacity-30">
            <rect width="100%" height="100%" fill="url(#noisePattern)" />
          </svg>
        </motion.div>
        
        {/* Cyan Circle */}
        <motion.div 
          drag
          dragConstraints={constraintsRef}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
          style={{ cursor: "grab" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: [0, -20, 15, -10, 0], 
            y: [0, 20, -10, 15, 0] 
          }}
          transition={{ 
            opacity: { duration: 2, delay: 1 },
            scale: { duration: 2, delay: 1, type: "spring" },
            x: { duration: 17, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            y: { duration: 19, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
          }}
          className="absolute top-[20%] right-[15%] md:right-[25%] w-[25vw] md:w-[15vw] h-[25vw] md:h-[15vw] rounded-full bg-[#00E5FF] pointer-events-auto border-[2px] border-white/40 drop-shadow-2xl overflow-hidden"
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay opacity-30 rounded-full">
            <rect width="100%" height="100%" fill="url(#noisePattern)" />
          </svg>
        </motion.div>

        {/* Magenta Arrow */}
        <motion.svg 
          drag
          dragConstraints={constraintsRef}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
          style={{ cursor: "grab" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: [0, 15, -10, 20, 0], 
            y: [0, -20, 15, -10, 0],
            rotate: [10, -5, 15, 0, 10]
          }}
          transition={{ 
            opacity: { duration: 2, delay: 1.2 },
            scale: { duration: 2, delay: 1.2, type: "spring" },
            x: { duration: 16, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            y: { duration: 21, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            rotate: { duration: 22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
          }}
          viewBox="0 0 100 100" 
          className="absolute bottom-[20%] md:bottom-[18%] left-[25%] md:left-[28%] w-[25vw] md:w-[15vw] h-[25vw] md:h-[15vw] pointer-events-auto drop-shadow-2xl"
        >
          <path d="M50 0 L100 50 L75 50 L75 100 L25 100 L25 50 L0 50 Z" fill="#FF00FF" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M50 0 L100 50 L75 50 L75 100 L25 100 L25 50 L0 50 Z" fill="url(#noisePattern)" style={{ mixBlendMode: 'overlay' }} opacity="0.3" />
        </motion.svg>

        {/* Green Plus */}
        <motion.svg 
          drag
          dragConstraints={constraintsRef}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
          style={{ cursor: "grab" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: [0, -15, 20, -10, 0], 
            y: [0, 10, -20, 15, 0],
            rotate: [0, 20, -10, 15, 0]
          }}
          transition={{ 
            opacity: { duration: 2, delay: 1.4 },
            scale: { duration: 2, delay: 1.4, type: "spring" },
            x: { duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            y: { duration: 16, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            rotate: { duration: 25, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
          }}
          viewBox="0 0 100 100"
          className="absolute bottom-[20%] md:bottom-[18%] right-[25%] md:right-[28%] w-[20vw] md:w-[12vw] h-[20vw] md:h-[12vw] pointer-events-auto drop-shadow-2xl"
        >
          <path d="M35 0 H65 V35 H100 V65 H65 V100 H35 V65 H0 V35 H35 Z" fill="#00E676" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinejoin="round" />
          <path d="M35 0 H65 V35 H100 V65 H65 V100 H35 V65 H0 V35 H35 Z" fill="url(#noisePattern)" style={{ mixBlendMode: 'overlay' }} opacity="0.3" />
        </motion.svg>

        {/* Orange Triangle */}
        <motion.svg 
          drag
          dragConstraints={constraintsRef}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
          style={{ cursor: "grab" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: [0, 20, -15, 10, 0], 
            y: [0, -10, 20, -15, 0],
            rotate: [-10, 15, -5, 20, -10]
          }}
          transition={{ 
            opacity: { duration: 2, delay: 1.6 },
            scale: { duration: 2, delay: 1.6, type: "spring" },
            x: { duration: 19, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            y: { duration: 17, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
            rotate: { duration: 24, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
          }}
          viewBox="0 0 100 100" 
          className="absolute top-[50%] left-[45%] w-[15vw] md:w-[10vw] h-[15vw] md:h-[10vw] pointer-events-auto drop-shadow-2xl"
        >
          <polygon points="50,0 100,100 0,100" fill="#FF9100" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="50,0 100,100 0,100" fill="url(#noisePattern)" style={{ mixBlendMode: 'overlay' }} opacity="0.3" />
        </motion.svg>
      </div>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="flex justify-end items-start w-full font-mono text-[10px] uppercase tracking-widest text-fg-soft relative z-40 pointer-events-none"
      >
        <motion.div variants={itemVars} className="flex flex-col gap-1 text-right">
          <span>CHANDIGARH / INDIA</span>
          <span>AGE 18</span>
        </motion.div>
      </motion.div>

      <div className="flex flex-col justify-center items-center flex-1 w-full relative z-20 pointer-events-none">
        <motion.div 
          initial="hidden"
          animate="show"
          className="flex flex-col items-center justify-center space-y-[-2vw] md:space-y-[-1vw]"
        >
          {["THE", "LIFE", "OF", "JOSH"].map((word, i) => (
            <motion.h1 
              key={word}
              variants={largeTextVars}
              custom={i}
              initial="hidden"
              animate="show"
              transition={{ delay: 1.2 + (i * 0.1) }}
              className="text-[15vw] md:text-[12vw] font-bold leading-none tracking-tighter text-white"
            >
              {word}
            </motion.h1>
          ))}
        </motion.div>
      </div>

      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="show"
        transition={{ delayChildren: 3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-end pb-24 md:pb-12 pt-8 relative z-40 pointer-events-none"
      >
        <motion.div variants={itemVars} className="text-xl md:text-2xl font-medium tracking-tight">
          Not a résumé.<br />
          <span className="text-fg-soft">Just the receipts.</span>
        </motion.div>
        <motion.div variants={itemVars} className="md:text-right font-mono text-xs text-fg-soft uppercase tracking-widest leading-loose">
          18 years.<br />
          Too many obsessions.<br />
          A few wins.<br />
          A few spectacular failures.<br />
          <span className="text-accent">Still building.</span>
        </motion.div>
      </motion.div>
            </motion.div>
      </div>
    </section>
  );
}
