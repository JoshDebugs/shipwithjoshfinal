"use client";

/**
 * Keeps one world's failure (a code chunk that won't load, a runtime error)
 * from taking down the whole page: the rest of the film keeps playing and the
 * broken world shows a quiet title card on its own background instead.
 */

import { Component, type ReactNode } from "react";
import { RISO } from "./palette";
import type { WorldMeta } from "./types";

function luminance(hex: string) {
  const h = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(h)) return 0.5;
  const n = parseInt(h, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ink or paper, whichever reads better on `bg`. */
function textOn(bg: string) {
  const l = luminance(bg);
  const onInk = (l + 0.05) / (luminance(RISO.ink) + 0.05);
  const onPaper = (luminance(RISO.paper) + 0.05) / (l + 0.05);
  return onInk >= onPaper ? RISO.ink : RISO.paper;
}

type Props = { meta: WorldMeta; children: ReactNode; /** In document flow (reduced motion) rather than filling the stage. */ flow?: boolean };
type State = { failed: boolean };

export class WorldBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { meta, flow } = this.props;
    // a see-through layer (the bridge over the hero) has nothing of its own to show
    if (meta.bg === "transparent") return null;
    const color = textOn(meta.bg);
    return (
      <div
        className={`${flow ? "min-h-[70vh] py-24" : "absolute inset-0"} grid place-items-center px-6 text-center`}
        style={{ background: meta.bg, color }}
      >
        {meta.title ? (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] opacity-70">
              {meta.number} · {meta.label}
            </p>
            <p className="mt-4 text-[clamp(2.5rem,7vw,5.5rem)] uppercase leading-[0.9]" style={{ fontFamily: "var(--f-anton)" }}>
              {meta.title}
            </p>
          </div>
        ) : null}
      </div>
    );
  }
}
