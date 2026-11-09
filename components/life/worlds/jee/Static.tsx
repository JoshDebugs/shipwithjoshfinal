"use client";

/**
 * Reduced motion: the three shadows, already cast. One wall holds the small
 * stack and its JEE beside the two-year pile and its towering IIT; the lamp goes
 * out; then the same pile, from a new angle, throws a laptop.
 */

import type { CSSProperties, ReactNode } from "react";
import { useStage } from "@/components/life/multiverse/runtime";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { BookPile, Desk, LampSilhouette, LaptopShadow, LightPool, iitPath, jeePath } from "./diorama";

const FRAUNCES = "var(--f-fraunces)";
const MONO = "var(--font-geist-mono)";

const line = (size: string | number, wght: number, extra?: CSSProperties): CSSProperties => ({
  fontFamily: FRAUNCES,
  color: RISO.paper,
  fontSize: size,
  fontVariationSettings: `"SOFT" 30, "WONK" 0, "opsz" 96, "wght" ${wght}`,
  lineHeight: 1.06,
  ...extra,
});

const label: CSSProperties = {
  fontFamily: MONO,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

export default function JeeStatic() {
  const stage = useStage();
  const W = Math.max(320, stage.width || 1280);
  const mobile = W < 768;
  return mobile ? <Phone W={W} /> : <Desktop W={W} />;
}

function Room({ W, H, children, overlay }: { W: number; H: number; children: ReactNode; overlay?: ReactNode }) {
  return (
    <div className="relative overflow-hidden" style={{ height: H, background: RISO.ink }}>
      <svg aria-hidden width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0">
        {children}
      </svg>
      {overlay}
    </div>
  );
}

function LightsOut({ pad, big, small, h }: { pad: number | string; big: number | string; small: number | string; h: number | string }) {
  return (
    <div className="flex flex-col justify-center" style={{ minHeight: h, padding: `56px ${typeof pad === "number" ? `${pad}px` : pad}`, background: RISO.ink }}>
      <p style={line(big, 380, { letterSpacing: "-0.012em", lineHeight: 1.04 })}>IIT didn&apos;t happen.</p>
      <p style={line(small, 300, { color: alpha(RISO.paper, 0.76), marginTop: 22 })}>This one didn&apos;t work.</p>
    </div>
  );
}

function Desktop({ W }: { W: number }) {
  // the wall of the build-up: the first small stack, then what two years of it cast
  const H1 = Math.min(780, Math.round(W * 0.54));
  const seam = H1 * 0.78;
  const floor = H1 * 0.92;

  const jeeCap = H1 * 0.27;
  const jeeW = jeeCap * 1.12;
  const jeeX = W * 0.06;
  const jeeBase = seam - H1 * 0.17;
  const jeeCx = jeeX + jeeW * 0.75;

  const iitTop = Math.max(H1 * 0.2, 150);
  const iitCap = seam - iitTop;
  const iitW = iitCap * 0.98;
  const iitX = W * 0.36;
  const pileCx = iitX + iitW * 0.49;
  const poolCx = W * 0.345;
  const planLeft = W * 0.745;

  // the wall of the new angle
  const H2 = Math.min(800, Math.round(W * 0.56));
  const size = Math.min(W * 0.4, H2 * 0.76);
  const lapX = W * 0.38 - size / 2;
  const lapY = H2 * 0.08;
  const lapCx = lapX + size / 2;
  const floor2 = H2 * 0.96;
  const copyLeft = Math.max(lapX + size + 56, W * 0.66);
  const lampSize = H2 * 0.36;

  return (
    <section aria-label="JEE, age 18: Projections" style={{ background: RISO.ink, color: RISO.paper }}>
      <Room
        W={W}
        H={H1}
        overlay={
          <>
            <p className="absolute" style={{ ...label, left: jeeX, top: jeeBase - jeeCap - 34, color: RISO.ink, fontSize: 13 }}>
              Age 18 · ~2 years of JEE prep
            </p>
            <div className="absolute" style={{ left: planLeft, right: 36, top: H1 * 0.28 }}>
              <p style={line("clamp(17px, 1.5vw, 24px)", 360, { lineHeight: 1.3 })}>~2 years of JEE prep.</p>
              <p style={line("clamp(30px, 3.4vw, 54px)", 480, { marginTop: 10 })}>The plan had a shape.</p>
            </div>
          </>
        }
      >
        <LightPool cx={poolCx} cy={H1 * 0.42} rx={W * 0.4} ry={H1 * 1.12} core={0.86} />
        <path d={jeePath(jeeX, jeeBase, jeeW, jeeCap)} fill={RISO.ink} />
        <path d={iitPath(iitX, seam, iitW, iitCap)} fill={RISO.ink} />
        <Desk width={W} top={seam} bottom={H1} cx={poolCx} />
        <BookPile cx={jeeCx} base={floor} width={W * 0.11} height={H1 * 0.15} columns={1} seed={3} />
        <BookPile cx={pileCx} base={floor} width={W * 0.29} height={H1 * 0.3} columns={7} seed={8} />
      </Room>

      <LightsOut pad="12vw" big="clamp(52px, 7vw, 108px)" small="clamp(26px, 3vw, 44px)" h="44vh" />

      <Room
        W={W}
        H={H2}
        overlay={
          <div className="absolute" style={{ left: copyLeft, right: 36, top: H2 * 0.16 }}>
            <p style={line("clamp(26px, 2.6vw, 40px)", 380)}>Some plans end.</p>
            <p style={line("clamp(44px, 5.2vw, 80px)", 700, { marginTop: 20, lineHeight: 1.02, fontVariationSettings: '"SOFT" 0, "WONK" 0, "opsz" 144, "wght" 700' })}>The person doesn&apos;t.</p>
            <p style={{ ...label, marginTop: 24, fontSize: 13 }}>Same pile. New angle.</p>
          </div>
        }
      >
        <LightPool cx={lapCx - W * 0.02} cy={lapY + size * 0.44} rx={size * 1.02} ry={size * 1.0} />
        <LaptopShadow x={lapX} y={lapY} size={size} />
        <Desk width={W} top={H2 * 0.82} bottom={H2} cx={lapCx} />
        <BookPile cx={lapCx} base={floor2} width={W * 0.3} height={H2 * 0.25} columns={7} seed={8} />
        <LampSilhouette x={W - lampSize - W * 0.05} y={floor2 - lampSize * 0.94} size={lampSize} />
      </Room>
    </section>
  );
}

function Phone({ W }: { W: number }) {
  const H0 = Math.round(W * 0.98);
  const capJ = W * 0.26;
  const jw = capJ * 1.42;
  const jx = (W - jw * 1.5) / 2 + 6;
  const jBase = H0 * 0.6;

  const H1 = Math.round(W * 1.62);
  const iTop = H1 * 0.2;
  const iBase = H1 * 0.86;
  const icap = iBase - iTop;
  const iw = Math.min(W * 0.78, icap * 0.82);
  const ix = (W - iw) / 2;

  const H2 = Math.round(W * 1.7);
  const size = W * 0.86;
  const lx = (W - size) / 2;
  const ly = H2 * 0.34;
  const floor2 = H2 * 0.96;
  const lamp = W * 0.32;

  return (
    <section aria-label="JEE, age 18: Projections" style={{ background: RISO.ink, color: RISO.paper }}>
      <Room
        W={W}
        H={H0}
        overlay={
          <p className="absolute left-0 right-0 text-center" style={{ ...label, top: jBase - capJ - 28, color: RISO.ink, fontSize: 11 }}>
            Age 18 · ~2 years of JEE prep
          </p>
        }
      >
        <LightPool cx={W / 2} cy={H0 * 0.44} rx={W * 0.85} ry={H0 * 0.62} />
        <path d={jeePath(jx, jBase, jw, capJ)} fill={RISO.ink} />
        <Desk width={W} top={H0 * 0.74} bottom={H0} cx={W / 2} />
        <BookPile cx={W / 2} base={H0 * 0.92} width={W * 0.4} height={H0 * 0.26} columns={1} seed={3} />
      </Room>

      <Room
        W={W}
        H={H1}
        overlay={
          <div className="absolute" style={{ left: 22, right: 22, top: 26 }}>
            <p style={line(15, 360, { lineHeight: 1.3 })}>~2 years of JEE prep.</p>
            <p style={line(30, 480, { marginTop: 2 })}>The plan had a shape.</p>
          </div>
        }
      >
        <LightPool cx={W / 2} cy={H1 * 0.58} rx={W * 0.96} ry={H1 * 0.46} />
        <path d={iitPath(ix, iBase, iw, icap)} fill={RISO.ink} />
        <Desk width={W} top={H1 * 0.86} bottom={H1} cx={W / 2} />
        <BookPile cx={W / 2} base={H1 * 0.97} width={W * 0.76} height={H1 * 0.2} columns={4} seed={8} />
      </Room>

      <LightsOut pad={24} big={44} small={24} h="38vh" />

      <Room
        W={W}
        H={H2}
        overlay={
          <div className="absolute" style={{ left: 22, right: 22, top: 26 }}>
            <p style={line(24, 380)}>Some plans end.</p>
            <p style={line(38, 700, { marginTop: 10, fontVariationSettings: '"SOFT" 0, "WONK" 0, "opsz" 144, "wght" 700' })}>The person doesn&apos;t.</p>
            <p style={{ ...label, marginTop: 14, fontSize: 11 }}>Same pile. New angle.</p>
          </div>
        }
      >
        <LightPool cx={W / 2} cy={ly + size * 0.42} rx={size * 0.86} ry={size * 0.74} />
        <LaptopShadow x={lx} y={ly} size={size} />
        <Desk width={W} top={H2 * 0.83} bottom={H2} cx={W / 2} />
        <BookPile cx={W * 0.46} base={floor2} width={W * 0.72} height={H2 * 0.2} columns={4} seed={8} />
        <LampSilhouette x={W - lamp - 2} y={floor2 - lamp * 0.94} size={lamp} />
      </Room>
    </section>
  );
}
