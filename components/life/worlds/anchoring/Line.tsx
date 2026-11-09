/**
 * A line of voice-shaped type. Its width/weight axes are fixed per line (each
 * line is printed at the volume it was spoken at); the world animates the
 * wrapper (level rise, fade). Rows marked `data-fit` are sized to a fraction
 * of the stage width once the face has loaded.
 */
import type { CSSProperties, ReactNode, Ref } from "react";
import { RISO } from "@/components/life/multiverse/palette";

export const ANYBODY = "var(--f-anybody), var(--font-geist-sans), sans-serif";
export const MONO = "var(--font-geist-mono), ui-monospace, monospace";

export function Line({
  elRef,
  y,
  rows,
  fit,
  perRow = false,
  fitMax,
  fontSize,
  axes,
  lineHeight = 0.92,
  shadow,
  upper = false,
  tracking = "-0.01em",
  sub,
  style,
}: {
  elRef?: Ref<HTMLDivElement>;
  y: number;
  rows: readonly string[];
  /** Fraction of the stage width the widest row (or each row, with perRow) should fill. */
  fit?: number;
  perRow?: boolean;
  fitMax?: number;
  fontSize?: number;
  axes: string;
  lineHeight?: number;
  /** Misregistered colour plate behind the ink. */
  shadow?: string;
  upper?: boolean;
  tracking?: string;
  sub?: ReactNode;
  style?: CSSProperties;
}) {
  const text: CSSProperties = {
    fontFamily: ANYBODY,
    fontVariationSettings: axes,
    lineHeight,
    letterSpacing: tracking,
    color: RISO.ink,
    textShadow: shadow ? `0.03em 0.025em 0 ${shadow}` : undefined,
    textTransform: upper ? "uppercase" : undefined,
    ...(fontSize ? { fontSize } : null),
  };
  const fitAttr = (on: boolean) => (on && fit ? { "data-fit": String(fit), ...(fitMax ? { "data-fit-max": String(Math.round(fitMax)) } : null) } : {});
  return (
    <div
      ref={elRef}
      className="pointer-events-none absolute left-1/2 flex flex-col items-center text-center"
      style={{ top: y, opacity: 0, visibility: "hidden", transform: "translate(-50%, -50%)", willChange: "transform, opacity", ...style }}
    >
      <div className="inline-block whitespace-nowrap" style={text} {...fitAttr(!perRow)}>
        {rows.map((r, i) =>
          perRow ? (
            <div key={i}>
              <span className="inline-block whitespace-nowrap" {...fitAttr(true)}>
                {r}
              </span>
            </div>
          ) : (
            <div key={i} className="whitespace-nowrap">
              {r}
            </div>
          ),
        )}
      </div>
      {sub}
    </div>
  );
}

/** Small mono caption under a line. */
export function Sub({ children, dot }: { children: ReactNode; dot?: string }) {
  return (
    <div
      className="mt-3 flex items-center gap-2 whitespace-nowrap uppercase"
      style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.26em", color: RISO.ink, opacity: 0.8 }}
    >
      {dot && <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: dot }} />}
      {children}
    </div>
  );
}
