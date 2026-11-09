import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PearlButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function PearlButton({ children = "Pearl Button", onClick, className = "" }: PearlButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative group flex items-center justify-center px-8 py-3.5 rounded-full
        bg-gradient-to-b from-[#4a4a4a] via-[#111] to-[#0a0a0a]
        border border-[#1a1a1a] 
        shadow-[0_10px_20px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-2px_8px_rgba(0,0,0,0.8),inset_0_-1px_1px_rgba(255,255,255,0.1)]
        overflow-hidden transition-all duration-300
        ${className}
      `}
      style={{
        WebkitTapHighlightColor: "transparent"
      }}
    >
      {/* Top Glass Reflection */}
      <div 
        className="absolute top-[1px] left-[2%] w-[96%] h-[48%] rounded-t-full rounded-b-[100%] opacity-70 transition-opacity duration-300 group-hover:opacity-90 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.02) 100%)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)"
        }}
      />
      
      {/* Subtle Inner Glow on hover */}
      <div 
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)"
        }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2.5 text-[16px] font-medium tracking-wide text-[#d1d1d1] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
        <svg 
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="opacity-80"
        >
          <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z" />
        </svg>
        {children}
      </span>
    </motion.button>
  );
}
