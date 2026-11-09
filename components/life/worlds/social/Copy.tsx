"use client";

/**
 * Every word of the world, as real DOM text, laid out per stage size.
 * Blocks open and shut with eyelid wipes (see lids.ts); the world's
 * progress/ticker callbacks write the few values that move (counter digits,
 * font axes, the slam, the gavel) straight to these elements.
 */

import { memo, type CSSProperties, type ReactNode } from "react";
import { RISO } from "@/components/life/multiverse/palette";
import { iconSvg } from "@/components/life/multiverse/portalIcons";
import { OEye, type OEyeParts } from "./OEye";
import { CLOSED, FONT, LidRegistry, axes, lashStyle, monoLabel, sticker } from "./lids";
import { SHOW, type Layout } from "./timeline";

export type CopyHandles = {
  eyes: (OEyeParts | null)[];
  headBlock: HTMLElement | null;
  headline: HTMLElement | null;
  headLines: (HTMLElement | null)[];
  kicker: HTMLElement | null;
  viewsWrap: HTMLElement | null;
  viewsNum: HTMLElement | null;
  viewsLabel: HTMLElement | null;
  followBlock: HTMLElement | null;
  blinkBlock: HTMLElement | null;
  followNum: HTMLElement | null;
  gavel: HTMLElement | null;
};

export function emptyHandles(): CopyHandles {
  return {
    eyes: [null, null, null, null],
    headBlock: null,
    headline: null,
    headLines: [],
    kicker: null,
    viewsWrap: null,
    viewsNum: null,
    viewsLabel: null,
    followBlock: null,
    blinkBlock: null,
    followNum: null,
    gavel: null,
  };
}

function LidBox({
  reg,
  name,
  win,
  lash = 4,
  style,
  children,
}: {
  reg: LidRegistry;
  name: string;
  win: readonly [number, number];
  lash?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span className="block" style={{ position: "relative", ...style }}>
      <span className="block" ref={reg.ref(name, "body", win)} style={CLOSED}>
        {children}
      </span>
      <span aria-hidden ref={reg.ref(name, "lash", win)} style={lashStyle(lash)} />
    </span>
  );
}

export const HEAD_LINES = {
  desktop: ["Before I knew what a startup was,", "I was already trying to get", "strangers on the internet", "to pay attention."],
  mobile: ["Before I knew", "what a startup was,", "I was already trying", "to get strangers on", "the internet to pay", "attention."],
};

export function sizes(L: Layout) {
  const { W, H, mobile } = L;
  const c = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  return mobile
    ? {
        title: Math.min(W * 0.178, 84),
        tag: 13,
        head: c(W * 0.064, 21, 26),
        kicker: 10.5,
        views: c(W * 0.175, 56, 72),
        viewsTop: 66,
        caption: 16,
        blinks: c(W * 0.09, 28, 38),
        stayed: c(W * 0.125, 38, 52),
        follow: c(W * 0.27, 80, 110),
        literally: c(W * 0.08, 24, 32),
        final: c(W * 0.092, 28, 38),
        noted: c(W * 0.08, 24, 32),
        stareY: H * 0.25,
        stareScale: 1.3,
      }
    : {
        title: Math.min(W * 0.15, H * 0.245),
        tag: 17,
        head: c(W * 0.0285, 26, 44),
        kicker: 13,
        views: c(W * 0.074, 56, 116),
        viewsTop: 92,
        caption: c(W * 0.0155, 15, 23),
        blinks: c(W * 0.042, 30, 64),
        stayed: c(W * 0.064, 40, 104),
        follow: c(W * 0.1, 70, 160),
        literally: c(W * 0.034, 26, 52),
        final: c(W * 0.038, 30, 60),
        noted: c(W * 0.034, 26, 52),
        stareY: H * 0.285,
        stareScale: 1.55,
      };
}

export const Copy = memo(function Copy({ L, reg, h }: { L: Layout; reg: LidRegistry; h: CopyHandles }) {
  const { W, H, mobile, pad } = L;
  const s = sizes(L);
  const eye = (i: number) => (parts: OEyeParts) => {
    h.eyes[i] = parts;
  };
  const oStyle = (fs: number): CSSProperties => ({
    width: "0.9em",
    height: "0.72em",
    verticalAlign: "-0.012em",
    margin: "0 0.02em",
    fontSize: fs,
  });
  const lines = mobile ? HEAD_LINES.mobile : HEAD_LINES.desktop;
  const pill: CSSProperties = {
    background: RISO.paper,
    border: `2px solid ${RISO.ink}`,
    boxShadow: `2px 3px 0 ${RISO.ink}`,
    borderRadius: 999,
    padding: mobile ? "3px 9px 2px" : "4px 11px 3px",
  };
  const finalLines = mobile ? ["Attention is easy", "to get and hard", "to keep."] : ["Attention is easy to get", "and hard to keep."];
  const anybody = (wdth: number, wght: number): CSSProperties => ({
    fontFamily: FONT.anybody,
    fontVariationSettings: axes(wdth, wght),
  });

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 3 }}>
      {/* ---------------------------------------------------------- title card */}
      <div className="absolute inset-x-0" style={{ top: L.cy + (mobile ? 0 : H * 0.01), transform: "translateY(-50%)" }}>
        <LidBox reg={reg} name="title" win={SHOW.title} lash={Math.max(4, s.title * 0.045)}>
          <h2
            aria-label="Look at me."
            className="text-center"
            style={{ ...anybody(150, 900), fontSize: s.title, lineHeight: 0.86, color: RISO.ink, letterSpacing: "-0.012em" }}
          >
            <span aria-hidden className="block whitespace-nowrap">
              L
              <OEye register={eye(0)} style={oStyle(s.title)} />
              <OEye register={eye(1)} style={oStyle(s.title)} />K
            </span>
            <span aria-hidden className="block whitespace-nowrap">
              AT ME.
            </span>
          </h2>
          <span className="mt-[0.9em] block text-center" style={monoLabel(mobile ? 11 : 15)}>
            {mobile ? (
              <>
                World 04 · Age 15
                <br />
                Instagram content creation
              </>
            ) : (
              "World 04 · Age 15 · Instagram content creation"
            )}
          </span>
        </LidBox>
      </div>

      {/* ------------------------------------------------------------ corner tag */}
      <div className="absolute" style={{ left: mobile ? 14 : 24, top: mobile ? 14 : 22 }}>
        <LidBox reg={reg} name="tag" win={SHOW.tag} lash={2}>
          <span
            className="block whitespace-nowrap"
            style={{
              ...anybody(150, 900),
              fontSize: s.tag,
              lineHeight: 1,
              color: RISO.ink,
              background: RISO.paper,
              border: `2px solid ${RISO.ink}`,
              boxShadow: `3px 4px 0 ${RISO.ink}`,
              borderRadius: 999,
              padding: mobile ? "6px 11px 6px" : "8px 15px 8px",
            }}
          >
            L
            <OEye register={eye(2)} style={oStyle(s.tag)} />
            <OEye register={eye(3)} style={oStyle(s.tag)} />K AT ME.
          </span>
        </LidBox>
      </div>

      {/* --------------------------------------------------------- the headline */}
      <div
        ref={(el) => {
          h.headBlock = el;
        }}
        className="absolute"
        style={
          mobile
            ? { left: pad, right: pad, bottom: 96 }
            : { left: pad, bottom: Math.max(56, H * 0.075), width: Math.min(W * 0.46, 700) }
        }
      >
        <LidBox reg={reg} name="kicker" win={SHOW.kicker} lash={2}>
          <span
            ref={(el) => {
              h.kicker = el;
            }}
            className="inline-block"
            style={monoLabel(s.kicker)}
          >
            {mobile ? (
              <>
                Age 15. Instagram.
                <br />
                One goal: get looked at.
              </>
            ) : (
              "Age 15. Instagram. One goal: get looked at."
            )}
          </span>
        </LidBox>
        <h3
          ref={(el) => {
            h.headline = el;
          }}
          style={{ ...anybody(84, 420), fontSize: s.head, lineHeight: 1.04, color: RISO.ink, marginTop: mobile ? 10 : 14 }}
        >
          {lines.map((ln, i) => (
            <LidBox key={ln} reg={reg} name={`line${i}`} win={[SHOW.line0[0] + i * 0.007, SHOW.line0[1]]} lash={3}>
              <span
                ref={(el) => {
                  h.headLines[i] = el;
                }}
                className="inline-block whitespace-nowrap"
              >{`${ln} `}</span>
            </LidBox>
          ))}
        </h3>
      </div>

      {/* ---------------------------------------------------------- the counter */}
      <div
        ref={(el) => {
          h.viewsWrap = el;
        }}
        className="absolute left-0 top-0"
        style={{ willChange: "transform", transformOrigin: "50% 50%" }}
      >
        <LidBox reg={reg} name="views" win={SHOW.views} lash={4}>
          <span className="block text-center" style={{ marginBottom: mobile ? 4 : 6 }}>
            <span
              ref={(el) => {
                h.viewsLabel = el;
              }}
              className="inline-block"
              style={{ ...pill, ...monoLabel(mobile ? 10.5 : 12) }}
            >
              View
            </span>
          </span>
          <span
            ref={(el) => {
              h.viewsNum = el;
            }}
            className="block whitespace-nowrap text-center"
            style={{
              ...anybody(60, 300),
              ...sticker(s.views, 0.06, 0.055),
              fontSize: s.views,
              lineHeight: 0.92,
              fontVariantNumeric: "tabular-nums",
              padding: "0 0.06em 0.06em",
            }}
          >
            1
          </span>
        </LidBox>
      </div>

      {/* -------------------------------------------------------- stare caption */}
      <div className="absolute left-1/2" style={{ top: H * (mobile ? 0.755 : 0.8), transform: "translate(-50%, -50%)" }}>
        <LidBox reg={reg} name="caption" win={SHOW.caption} lash={3}>
          <span
            className="block text-center"
            style={{
              ...anybody(100, 640),
              fontSize: s.caption,
              lineHeight: 1.2,
              color: RISO.ink,
              background: RISO.paper,
              border: `2.5px solid ${RISO.ink}`,
              boxShadow: `5px 6px 0 ${RISO.ink}`,
              borderRadius: mobile ? 20 : 999,
              padding: mobile ? "10px 18px" : "11px 26px 12px",
              whiteSpace: mobile ? "normal" : "nowrap",
              width: mobile ? W - 64 : undefined,
            }}
          >
            This is what that feels like from the inside.
          </span>
        </LidBox>
      </div>

      {/* --------------------------------------------------------- the blink */}
      <div
        ref={(el) => {
          h.blinkBlock = el;
        }}
        className="absolute left-1/2"
        style={{ top: H * (mobile ? 0.8 : 0.82), transform: "translate(-50%, -50%)" }}
      >
        <LidBox reg={reg} name="blinks" win={SHOW.blinks} lash={4}>
          <span className="block whitespace-nowrap text-center" style={{ fontFamily: FONT.bagel, fontSize: s.blinks, lineHeight: 1.1, ...sticker(s.blinks) }}>
            Then everyone blinks.
          </span>
        </LidBox>
      </div>

      <div className="absolute left-1/2" style={{ top: H * 0.5, transform: "translate(-50%, -50%)" }}>
        <LidBox reg={reg} name="stayed" win={SHOW.stayed} lash={5}>
          <span className="block whitespace-nowrap text-center" style={{ fontFamily: FONT.bagel, fontSize: s.stayed, lineHeight: 1.02 }}>
            <span className="block" style={sticker(s.stayed)}>
              10M+ looked.
            </span>
            <span className="block" style={{ ...sticker(s.stayed), color: RISO.sun }}>
              2K+ stayed.
            </span>
          </span>
        </LidBox>
      </div>

      {/* ------------------------------------------------------- the followers */}
      <div
        ref={(el) => {
          h.followBlock = el;
        }}
        className="absolute"
        style={mobile ? { left: pad, right: pad, top: H * 0.1 } : { left: pad, top: H * 0.5, transform: "translateY(-56%)" }}
      >
        <LidBox reg={reg} name="follow" win={SHOW.follow} lash={4}>
          <span className={`block ${mobile ? "text-center" : ""}`} style={{ marginBottom: mobile ? 4 : 6 }}>
            <span className="inline-block" style={{ ...pill, ...monoLabel(mobile ? 10.5 : 12) }}>
              Followers
            </span>
          </span>
          <span
            ref={(el) => {
              h.followNum = el;
            }}
            className={`block whitespace-nowrap ${mobile ? "text-center" : ""}`}
            style={{
              ...anybody(130, 880),
              ...sticker(s.follow, 0.055, 0.05),
              color: RISO.sun,
              fontSize: s.follow,
              lineHeight: 0.92,
              padding: "0 0.06em 0.06em",
            }}
          >
            2K+
          </span>
        </LidBox>
        <LidBox reg={reg} name="literally" win={SHOW.literally} lash={3} style={{ marginTop: mobile ? 10 : 18 }}>
          <span className={`block ${mobile ? "text-center" : ""}`} style={{ fontFamily: FONT.bagel, fontSize: s.literally, lineHeight: 1.08, ...sticker(s.literally) }}>
            They follow.
            <br />
            Literally.
          </span>
        </LidBox>
      </div>

      {/* ---------------------------------------------------------- exit frame */}
      <div
        className="absolute"
        style={mobile ? { left: pad, right: pad, top: H * 0.1 } : { left: pad, top: H * 0.5, transform: "translateY(-55%)", width: W * 0.52 }}
      >
        <h3 style={{ ...anybody(92, 820), fontSize: s.final, lineHeight: 1.0, color: RISO.ink, letterSpacing: "-0.01em" }} className={mobile ? "text-center" : ""}>
          {finalLines.map((ln, i) => (
            <LidBox key={ln} reg={reg} name={`final${i}`} win={[SHOW.final[0] + i * 0.007, SHOW.final[1]]} lash={3}>
              <span className="block whitespace-nowrap">{`${ln} `}</span>
            </LidBox>
          ))}
        </h3>
        <LidBox reg={reg} name="noted" win={SHOW.noted} lash={3} style={{ marginTop: mobile ? 14 : 22 }}>
          <span className={`block ${mobile ? "text-center" : ""}`} style={{ fontFamily: FONT.bagel, fontSize: s.noted, lineHeight: 1.1, ...sticker(s.noted) }}>
            Noted, for later.
          </span>
        </LidBox>
      </div>

    </div>
  );
});

/** The next portal's silhouette, filled with the next world's ink. Sits UNDER the eye canvas. */
export const GavelMark = memo(function GavelMark({
  L,
  h,
  originRef,
}: {
  L: Layout;
  h: CopyHandles;
  originRef: (el: HTMLElement | null) => void;
}) {
  const gv = L.gavel;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }}>
      <div
        ref={(el) => {
          h.gavel = el;
        }}
        className="absolute [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
        style={{ left: gv.x, top: gv.y, width: gv.size, height: gv.size, transformOrigin: "42% 34%", transform: "scale(0)" }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${Math.round(gv.size * 0.022)}px, ${Math.round(gv.size * 0.026)}px)` }}
          dangerouslySetInnerHTML={{ __html: iconSvg("gavel", RISO.ink) }}
        />
        <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: iconSvg("gavel", RISO.cobalt) }} />
      </div>
      {/* the portal is born from this exact box (the icon's 100×100 frame) */}
      <div ref={originRef} className="absolute" style={{ left: gv.x, top: gv.y, width: gv.size, height: gv.size }} />
    </div>
  );
});
