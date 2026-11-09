"use client";

/**
 * Reduced motion: the case file, already closed. The print sits still with its
 * five minutiae marked and its live edge in sun, and every line of the film is
 * set around it in the same three voices: ridged display, forensic mono, and
 * the one soft italic that is Josh talking.
 */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { alpha, mix, RISO } from "@/components/life/multiverse/palette";
import { useStage } from "@/components/life/multiverse/runtime";
import { BANDS } from "./bands";
import { BACK, CHAOS, CURRENTLY, DOMAINS, HEADLINE, HONEST, MATCH, NEXT, STORY, SUBJECT, TITLE, VALUES } from "./copy";
import { MINUTIAE, PH, PW } from "./field";
import { BIG, CAP, EM, MONO, SERIF } from "./layout";
import { PrintCanvas } from "./PrintRaster";
import { RidgedText, contours } from "./RidgedText";
import { CTA_CSS, Thumbprint } from "./Thumbprint";

const DOTS = [RISO.sun, RISO.pink, mix(RISO.cobalt, RISO.paper, 0.32), mix(RISO.teal, RISO.paper, 0.28), RISO.paper];

export default function OutroStatic() {
  const stage = useStage();
  const W = Math.max(320, stage.width || 1280);
  const stacked = W < 900;
  const pad = stacked ? 20 : Math.max(36, Math.min(W * 0.052, 84));
  const inner = W - pad * 2;
  const k = stacked ? Math.min(W / 390, 1.5) : Math.min(W / 1440, 1.3);

  const printW = stacked ? inner : Math.min(inner * 0.44, 720);
  const printH = (printW * PH) / PW;
  const pin = (x: number, y: number) => ({ left: (x / PW + 0.5) * printW, top: (0.5 - y / PH) * printH });
  const R = Math.max(13, printW * 0.034);

  // title lockup (the same construction as the film's)
  const blockW = stacked ? Math.min(inner, 340 * k) : Math.min(inner * 0.4, 520);
  const s1 = blockW / EM["SO WHAT’S"];
  const s3 = blockW / EM["PATTERN?"];
  const s2 = s1 * 0.4;
  const gap = s1 * 0.13;
  const y1 = CAP * s1;
  const y2 = y1 + gap + CAP * s2;
  const y3 = y2 + gap + CAP * s3;
  const rk = s1 / 150;
  const titleContours = contours(rk, RISO.cobalt, RISO.sun);

  // verdict
  const headW = stacked ? inner : Math.min(inner - printW - pad, 430);
  const hs = (headW * 0.97) / EM["THINGS."];
  const hlead = hs * (CAP + 0.09);
  const hy1 = CAP * hs;
  const hTotal = hy1 + hlead * 2;
  const hk = hs / 240;
  const headRings = contours(hs / 150, RISO.cobalt, RISO.pink);

  const mono = (size: number, extra?: CSSProperties): CSSProperties => ({ ...MONO, fontSize: Math.max(10.5, size * k), ...extra });

  return (
    <section className="relative" style={{ background: RISO.ink, color: RISO.paper, padding: `${stacked ? 40 : 56 * k}px ${pad}px ${stacked ? 56 : 80 * k}px`, ["--outro-sun" as string]: RISO.sun, ["--outro-paper" as string]: RISO.paper }}>
      <style>{CTA_CSS}</style>

      {/* the question */}
      <header style={{ display: "flex", flexDirection: stacked ? "column" : "row", alignItems: stacked ? "stretch" : "flex-end", justifyContent: "space-between", gap: 28 * k, paddingBottom: (stacked ? 26 : 44) * k, borderBottom: `1px solid ${alpha(RISO.paper, 0.16)}` }}>
        <div style={{ position: "relative", width: blockW, height: y3 + 54 * k, flexShrink: 0, alignSelf: stacked ? "center" : undefined, margin: `${26 * k}px ${26 * k}px 0` }}>
          <h2 className="sr-only">So what’s the pattern?</h2>
          <RidgedText
            width={blockW}
            height={y3}
            fill={RISO.paper}
            rings={titleContours}
            lines={[
              { text: TITLE[0], size: s1, x: blockW / 2, y: y1 },
              { text: TITLE[1], size: s2, x: blockW / 2, y: y2 },
              { text: TITLE[2], size: s3, x: blockW / 2, y: y3 },
            ]}
          />
          <div aria-hidden className="absolute" style={{ left: blockW + 10 * k, top: y3 - CAP * s3, width: Math.max(7, 0.1 * s3), height: CAP * s3, background: RISO.sun }} />
          <p className="m-0 text-center" style={mono(12.5, { position: "absolute", left: 0, right: 0, top: y3 + 28 * k })}>
            {SUBJECT}
          </p>
        </div>
        <p className="m-0" style={{ ...SERIF, fontSize: (stacked ? 40 : 64) * k, lineHeight: 1.04, maxWidth: 560 * k, textAlign: stacked ? "center" : "right", alignSelf: stacked ? "center" : undefined }}>{CHAOS}</p>
      </header>

      <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", gap: (stacked ? 34 : 64) * k, marginTop: (stacked ? 30 : 50) * k }}>
        {/* the print */}
        <figure className="m-0" style={{ width: printW, flexShrink: 0 }}>
          <div style={{ position: "relative", width: printW, height: printH }}>
            <PrintCanvas width={printW} />
            {[
              [0, 0],
              [1, 0],
              [0, 1],
              [1, 1],
            ].map(([x, y], i) => (
              <span
                key={i}
                aria-hidden
                className="absolute"
                style={{
                  width: 26 * k,
                  height: 26 * k,
                  ...(x ? { right: 0 } : { left: 0 }),
                  ...(y ? { bottom: 0 } : { top: 0 }),
                  borderColor: RISO.cobalt,
                  borderStyle: "solid",
                  borderWidth: 0,
                  [x ? "borderRightWidth" : "borderLeftWidth"]: 2,
                  [y ? "borderBottomWidth" : "borderTopWidth"]: 2,
                }}
              />
            ))}
            {VALUES.map((v, i) => {
              const m = MINUTIAE[v.kind];
              const at = pin(m.x, m.y);
              return (
                <span key={v.kind} aria-hidden className="absolute grid place-items-center" style={{ ...at, width: R * 2, height: R * 2, marginLeft: -R, marginTop: -R, borderRadius: "50%", border: `2px solid ${RISO.pink}`, background: alpha(RISO.ink, 0.24) }}>
                  <span style={{ ...MONO, letterSpacing: 0, fontSize: Math.max(10, R * 0.8), fontWeight: 700, color: RISO.paper, textShadow: `0 0 4px ${RISO.ink}, 0 0 2px ${RISO.ink}` }}>{i + 1}</span>
                </span>
              );
            })}
          </div>
          <figcaption style={{ marginTop: 14 * k }}>
            <ul className="m-0 flex list-none flex-wrap p-0" style={{ columnGap: 16 * k, rowGap: 6 * k }}>
              {BANDS.map((b) => (
                <li key={b.id} className="flex items-center" style={{ ...mono(10.5), letterSpacing: "0.08em", gap: 6 * k }}>
                  <span aria-hidden style={{ width: 10 * k, height: 10 * k, borderRadius: "50%", background: b.ink, display: "inline-block" }} />
                  {b.name}
                </li>
              ))}
            </ul>
          </figcaption>
        </figure>

        {/* what the print says */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="m-0" style={mono(16, { color: RISO.sun, fontWeight: 500 })}>
            {MATCH}
          </p>
          <div style={{ marginTop: 20 * k, marginLeft: 20 * hk, width: hs * EM["THINGS."], height: hTotal, position: "relative" }}>
            <h2 className="sr-only">I keep trying things.</h2>
            <RidgedText width={hs * EM["THINGS."]} height={hTotal} fill={RISO.sun} rings={headRings} lines={HEADLINE.map((text, i) => ({ text, size: hs, x: (hs * EM["THINGS."]) / 2, y: hy1 + hlead * i }))} />
          </div>

          <ul className="m-0 flex list-none flex-wrap p-0" style={{ marginTop: 40 * k, columnGap: 14 * k, rowGap: 2 * k }}>
            {DOMAINS.map((d, i) => (
              <li key={d} className="flex items-baseline" style={{ gap: 14 * k }}>
                <span style={{ ...BIG, fontSize: (stacked ? 34 : 44) * k, lineHeight: 1.05, textTransform: "uppercase", color: [RISO.sun, RISO.pink, mix(RISO.cobalt, RISO.paper, 0.32), mix(RISO.teal, RISO.paper, 0.28), RISO.paper][i % 5] }}>{d}</span>
                {i < DOMAINS.length - 1 && <span aria-hidden style={{ opacity: 0.35 }}>·</span>}
              </li>
            ))}
          </ul>

          <div style={{ ...SERIF, marginTop: 30 * k, fontSize: (stacked ? 36 : 50) * k, lineHeight: 1.06 }}>
            <p className="m-0">{HONEST[0]}</p>
            <p className="m-0" style={{ color: RISO.sun, marginTop: "0.3em" }}>{HONEST[1]}</p>
          </div>

          {stacked && (
            <>
              <Rule k={k} />
              <Values k={k} stacked mono={mono} />
            </>
          )}
        </div>
      </div>

      {!stacked && (
        <div style={{ marginTop: 44 * k, paddingTop: 34 * k, borderTop: `1px solid ${alpha(RISO.paper, 0.16)}` }}>
          <Values k={k} stacked={false} mono={mono} />
        </div>
      )}

      <div style={{ marginTop: (stacked ? 36 : 44) * k, paddingTop: (stacked ? 30 : 36) * k, borderTop: `1px solid ${alpha(RISO.paper, 0.16)}`, display: "grid", gridTemplateColumns: stacked ? "1fr" : "minmax(0, 0.8fr) minmax(0, 1.25fr) minmax(0, 1fr)", gap: (stacked ? 34 : 56) * k, alignItems: "start" }}>
        <section>
          <div className="flex items-baseline" style={{ gap: 12 * k }}>
            <span style={{ ...BIG, fontSize: 62 * k, lineHeight: 1, color: RISO.sun }}>2026</span>
            <h3 className="m-0" style={mono(13, { letterSpacing: "0.22em", fontWeight: 500 })}>Currently</h3>
          </div>
          <ul className="m-0 list-none p-0" style={{ marginTop: 6 * k }}>
            {CURRENTLY.map((c) => (
              <li key={c} style={{ ...BIG, fontSize: 34 * k, lineHeight: 1.15, fontWeight: 800 }}>{c}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="m-0" style={{ ...BIG, fontSize: 34 * k, lineHeight: 1, color: RISO.sun, letterSpacing: "0.04em" }}>NEXT</h3>
          <ol className="m-0 list-none p-0" style={{ marginTop: 10 * k }}>
            {NEXT.map((n, i) => (
              <li key={n} className="flex items-center" style={{ gap: 12 * k, ...BIG, fontSize: (stacked ? 30 : 38) * k, lineHeight: 1.26, fontWeight: 700 }}>
                <span aria-hidden style={{ width: 8 * k, height: 8 * k, borderRadius: "50%", background: DOTS[i], flexShrink: 0 }} />
                {n}
              </li>
            ))}
          </ol>
        </section>

        <EndBlock k={k} stacked={stacked}>
          <p className="m-0" style={{ ...SERIF, fontSize: (stacked ? 56 : 68) * k, lineHeight: 1.04 }}>{STORY}</p>
        </EndBlock>
      </div>
    </section>
  );
}

/** The five minutiae: a ledger across the page on desktop, a list on phones. */
function Values({ k, stacked, mono }: { k: number; stacked: boolean; mono: (size: number, extra?: CSSProperties) => CSSProperties }) {
  const ring = (i: number) => (
    <span style={{ width: 30 * k, height: 30 * k, marginTop: stacked ? 4 * k : 0, flexShrink: 0, borderRadius: "50%", border: `2px solid ${RISO.pink}`, display: "grid", placeItems: "center", ...MONO, letterSpacing: 0, fontSize: 13 * k, fontWeight: 700 }}>{i + 1}</span>
  );
  return (
    <>
      <h3 className="m-0" style={{ ...BIG, fontSize: (stacked ? 34 : 42) * k, lineHeight: 1, letterSpacing: "0.02em" }}>CORE VALUES</h3>
      <ol className="m-0 list-none p-0" style={stacked ? { marginTop: 16 * k } : { marginTop: 18 * k, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", columnGap: 26 * k }}>
        {VALUES.map((v, i) =>
          stacked ? (
            <li key={v.kind} style={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 14 * k, padding: `${11 * k}px 0`, borderTop: i ? `1px solid ${alpha(RISO.paper, 0.14)}` : undefined }}>
              {ring(i)}
              <div>
                <div className="flex items-baseline" style={{ flexWrap: "wrap", columnGap: 12 * k }}>
                  <span style={{ ...BIG, fontSize: 38 * k, lineHeight: 1.05, color: RISO.sun }}>{v.name}</span>
                  <span style={mono(11, { opacity: 0.66 })}>{v.minutia}</span>
                </div>
                <p className="m-0" style={{ ...SERIF, fontSize: 26 * k, lineHeight: 1.1, marginTop: 2 * k }}>{v.line}</p>
              </div>
            </li>
          ) : (
            <li key={v.kind}>
              <div className="flex items-center" style={{ gap: 10 * k }}>
                {ring(i)}
                <span style={mono(11, { opacity: 0.66 })}>{v.minutia}</span>
              </div>
              <div style={{ ...BIG, fontSize: 34 * k, lineHeight: 1.05, color: RISO.sun, marginTop: 10 * k, whiteSpace: "nowrap" }}>{v.name}</div>
              <p className="m-0" style={{ ...SERIF, fontSize: 28 * k, lineHeight: 1.08, marginTop: 4 * k }}>{v.line}</p>
            </li>
          ),
        )}
      </ol>
    </>
  );
}

function Rule({ k }: { k: number }) {
  return <div aria-hidden style={{ height: 1, background: alpha(RISO.paper, 0.16), margin: `${30 * k}px 0` }} />;
}

function EndBlock({ k, stacked, children }: { k: number; stacked: boolean; children: ReactNode }) {
  const thumbW = 60 * k;
  return (
    <section style={{ display: "flex", flexDirection: "column", alignItems: stacked ? "center" : "flex-start", textAlign: stacked ? "center" : "left", gap: 18 * k }}>
      {children}
      <Link href="/" className="outro-cta" style={{ gap: 16 * k, padding: `${4 * k}px ${6 * k}px`, marginTop: 4 * k }}>
        <span className="outro-cta-thumb relative block" style={{ width: thumbW, height: thumbW * 1.32 }}>
          <span className="outro-cta-bleed" aria-hidden style={{ inset: -thumbW * 0.4 }} />
          <Thumbprint size={thumbW} />
        </span>
        <span className="outro-cta-label" style={{ ...BIG, fontSize: 38 * k, lineHeight: 1, letterSpacing: "0.015em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          <span aria-hidden style={{ marginRight: "0.32em" }}>←</span>
          {BACK}
        </span>
      </Link>
    </section>
  );
}
