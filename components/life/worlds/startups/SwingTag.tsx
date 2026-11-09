/**
 * LazyBull's FOR SALE swing tag. Desktop: tied through a punched hole and
 * hung off the paper's right edge into the room. Phone: hung inside its own
 * zone on the paper. The engine drops it on its string and swings it.
 */
import { C } from "./colors";
import type { Refs } from "./engine";
import type { Geo } from "./geometry";

export function tagLayout(g: Geo, rowH: number) {
  const u = g.u;
  const hole = g.mobile ? { x: g.rw * 0.5, y: 10 * u } : { x: g.rw - 16 * u, y: rowH * 0.5 };
  const pivot = g.mobile ? { x: g.rw * 0.5, y: 10 * u } : { x: g.rw + 52 * u, y: rowH * 0.5 + 10 * u };
  const w = (g.mobile ? 128 : 104) * u;
  const h = (g.mobile ? 60 : 92) * u;
  const str = (g.mobile ? 8 : 14) * u;
  return { hole, pivot, w, h, str };
}

export function SwingTag({ g, R, rowH }: { g: Geo; R: Refs; rowH: number }) {
  const u = g.u;
  const { hole, pivot, w, h, str } = tagLayout(g, rowH);
  return (
    <>
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{ left: hole.x - 4 * u, top: hole.y - 4 * u, width: 8 * u, height: 8 * u, background: C.ink, boxShadow: `0 0 0 ${1.5 * u}px ${C.paperDeep}` }}
      />
      {!g.mobile && (
        <svg aria-hidden className="absolute left-0 top-0 overflow-visible" width={1} height={1}>
          <path
            d={`M ${hole.x} ${hole.y} C ${hole.x + 18 * u} ${hole.y - 26 * u}, ${pivot.x - 12 * u} ${pivot.y - 30 * u}, ${pivot.x} ${pivot.y}`}
            stroke={C.paper}
            strokeWidth={1.6 * u}
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      )}
      <div
        ref={(el) => {
          R.swingWrap = el;
        }}
        className="absolute"
        style={{ left: pivot.x, top: pivot.y, width: 0, height: 0, transformOrigin: "0 0", opacity: 0 }}
      >
        <span aria-hidden className="absolute" style={{ left: -0.8 * u, top: 0, width: 1.6 * u, height: str, background: g.mobile ? C.ink : C.paper }} />
        <div
          ref={(el) => {
            R.swing = el;
          }}
          role="img"
          aria-label="For sale"
          className="absolute flex flex-col items-center justify-center"
          style={{
            left: -w / 2,
            top: str,
            width: w,
            height: h,
            background: C.pink,
            color: C.paper,
            clipPath: `polygon(${14 * u}px 0, ${w - 14 * u}px 0, 100% ${14 * u}px, 100% 100%, 0 100%, 0 ${14 * u}px)`,
            borderRadius: `0 0 ${6 * u}px ${6 * u}px`,
            fontFamily: "var(--f-rubik-mono)",
            fontSize: (g.mobile ? 17 : 21) * u,
            lineHeight: 1.05,
            letterSpacing: "0.02em",
            paddingTop: 10 * u,
            boxShadow: `inset 0 0 0 ${2 * u}px ${C.ribbonFold}`,
          }}
        >
          <span
            aria-hidden
            className="absolute rounded-full"
            style={{ top: 7 * u, left: "50%", width: 8 * u, height: 8 * u, marginLeft: -4 * u, background: C.paper, boxShadow: `0 0 0 ${2 * u}px ${C.ribbonFold}` }}
          />
          {g.mobile ? (
            <span aria-hidden>FOR SALE</span>
          ) : (
            <>
              <span aria-hidden>FOR</span>
              <span aria-hidden>SALE</span>
            </>
          )}
        </div>
      </div>
    </>
  );
}
