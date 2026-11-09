/**
 * 05 · MUN — reduced-motion composition. Motionless, normal document flow,
 * every line and fact of the world: ORDER., the redacted position paper, the
 * three speeches (their weight rising 100 → 900), the turned room as a static
 * plan, the card with its seal and stamps, and the line it was all for.
 */

import { useMemo } from "react";
import { useStage } from "@/components/life/multiverse/runtime";
import { RISO, alpha, mix, overprint } from "@/components/life/multiverse/palette";
import { hash } from "@/components/life/multiverse/ease";
import { COPY, PAPER, PAPER_SUMMARY } from "./copy";
import { HALL, buildHall } from "./hall";
import { archivo, fraunces, martian } from "./ink";
import { BURST, ConferenceStamp, Seal } from "./Seal";
import { GavelGlyph } from "./TitleCard";

const DEEP = overprint(RISO.cobalt, RISO.cobalt);
const BODY = mix(RISO.cobalt, RISO.ink, 0.58);
const THREADS = [RISO.paper, RISO.sun, RISO.teal];
const FRONTS = [RISO.sun, RISO.teal, RISO.paper, RISO.sun, RISO.ink, RISO.teal];

/** The room, fully turned: every gaze thread on Josh's card. */
function TurnedRoom({ mobile }: { mobile: boolean }) {
  const geo = useMemo(() => buildHall(mobile, 0.72), [mobile]);
  const C = geo.card;
  const cx = C.x;
  const cz = -C.z; // svg y = -z
  const arcPaths: string[] = [];
  geo.arcs.forEach((r) => {
    const a = HALL.aisle / r;
    const Lb = (2 * HALL.span - 4 * a) / 5;
    const rr = r - (HALL.deskIn + HALL.deskOut) / 2;
    for (let b = 0; b < 5; b++) {
      const s0 = -HALL.span + b * (Lb + a);
      const s1 = s0 + Lb;
      const p = (t: number) => `${(rr * Math.sin(t)).toFixed(3)} ${(rr * Math.cos(t)).toFixed(3)}`;
      arcPaths.push(`M${p(s0)} A${rr} ${rr} 0 0 0 ${p(s1)}`);
    }
  });
  return (
    <svg viewBox="-14.2 -3.4 28.4 18.6" className="block h-auto w-full" aria-hidden>
      <defs>
        <radialGradient id="mun-static-burst">
          <stop offset="0" stopColor={RISO.paper} stopOpacity="0.95" />
          <stop offset="0.2" stopColor={RISO.paper} stopOpacity="0.55" />
          <stop offset="0.45" stopColor={RISO.sun} stopOpacity="0.35" />
          <stop offset="1" stopColor={RISO.sun} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* floor: the well, the benches, the rail */}
      <path d={`M${-(geo.arcs[0] - 1.15)} 0 A${geo.arcs[0] - 1.15} ${geo.arcs[0] - 1.15} 0 0 0 ${geo.arcs[0] - 1.15} 0 Z`} fill={alpha(RISO.ink, 0.11)} />
      {arcPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={DEEP} strokeOpacity={0.62} strokeWidth={HALL.deskIn - HALL.deskOut} />
      ))}
      <rect x={-3.7} y={-2.6} width={7.4} height={0.55} fill={DEEP} fillOpacity={0.62} />
      <rect x={-0.95} y={cz - 0.22} width={1.9} height={0.44} fill={DEEP} fillOpacity={0.62} />
      {/* the chair and the (now ignored) opponent */}
      {[-1.75, 0, 1.75].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={-2.95} rx={HALL.bodyRX} ry={HALL.bodyRZ} fill={RISO.ink} />
          <circle cx={x} cy={-2.95} r={HALL.headR} fill={RISO.paper} />
        </g>
      ))}
      <rect x={-0.8} y={-0.22} width={1.6} height={0.5} fill={RISO.pink} opacity={0.5} />
      {/* threads */}
      <g opacity={0.5}>
        {geo.seats.map((s, i) => (
          <line
            key={i}
            x1={s.x}
            y1={-s.z}
            x2={cx}
            y2={cz}
            stroke={THREADS[s.thread]}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {/* delegates, all facing Josh, placards turned to their own colours */}
      {geo.seats.map((s, i) => {
        const dx = cx - s.x;
        const dz = cz + s.z; // in svg y
        const len = Math.hypot(dx, dz) || 1;
        const ux = dx / len;
        const uy = dz / len;
        const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
        return (
          <g key={i} transform={`translate(${s.x.toFixed(3)} ${(-s.z).toFixed(3)})`}>
            <ellipse cx={0.1} cy={0.12} rx={HALL.bodyRX} ry={HALL.bodyRZ} fill={alpha(RISO.ink, 0.26)} transform={`rotate(${ang + 90})`} />
            <ellipse rx={HALL.bodyRX} ry={HALL.bodyRZ} fill={BODY} transform={`rotate(${ang + 90})`} />
            <g transform={`translate(${ux * HALL.placardOff} ${uy * HALL.placardOff}) rotate(${ang + 90})`}>
              <rect x={-HALL.placardW / 2} y={-0.09} width={HALL.placardW} height={0.11} fill={FRONTS[s.placard % FRONTS.length]} />
              <rect x={-HALL.placardW / 2} y={0.02} width={HALL.placardW} height={0.07} fill={RISO.paper} />
            </g>
            <circle r={HALL.headR} fill={RISO.paper} />
            <circle cx={ux * HALL.headR * 0.5} cy={uy * HALL.headR * 0.5} r={0.07} fill={RISO.ink} />
          </g>
        );
      })}
      {/* Josh: sun, at the edge, where every thread lands */}
      <circle cx={cx} cy={cz} r={3.2} fill="url(#mun-static-burst)" />
      <rect x={cx - C.w / 2} y={cz - 0.09} width={C.w} height={0.18} fill={RISO.sun} />
      <ellipse cx={geo.josh.x} cy={-geo.josh.z} rx={HALL.bodyRX} ry={HALL.bodyRZ} fill={RISO.sun} />
      <circle cx={geo.josh.x} cy={-geo.josh.z} r={HALL.headR} fill={RISO.paper} />
    </svg>
  );
}

function StaticPaper({ fs }: { fs: number }) {
  return (
    <div
      role="img"
      aria-label={PAPER_SUMMARY}
      className="relative"
      style={{ background: RISO.paper, color: RISO.ink, padding: fs * 2, boxShadow: `14px 16px 0 ${DEEP}`, transform: "rotate(-1.5deg)" }}
    >
      <div aria-hidden>
        <div
          className="absolute"
          style={{
            right: fs * 1.6,
            top: fs * 1.4,
            padding: "0.2em 0.42em 0.14em",
            border: `${Math.max(4, Math.round(fs * 0.26))}px double ${RISO.pink}`,
            color: RISO.pink,
            ...archivo(68, 850),
            fontSize: fs * 1.3,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1,
            transform: "rotate(-8deg)",
            mixBlendMode: "multiply",
          }}
        >
          {COPY.paper.stamp}
        </div>
        <div style={{ fontFamily: "var(--f-courier)", fontSize: fs, lineHeight: 1.62 }}>
          <div className="font-bold" style={{ letterSpacing: "0.16em", fontSize: "0.82em", marginTop: fs * 2.6 }}>
            {COPY.paper.header}
          </div>
          <div style={{ height: 2, background: RISO.ink, margin: `${fs * 0.35}px 0 ${fs * 0.9}px`, opacity: 0.85 }} />
          {PAPER.map((runs, li) => (
            <div key={li} className="relative" style={{ minHeight: "1.62em", whiteSpace: "pre" }}>
              {runs.map((run, ri) =>
                run.kind === "redact" ? (
                  <span key={ri}>
                    {run.text.split(" ").map((word, wi, arr) => (
                      <span key={wi}>
                        <span
                          style={{
                            background: RISO.ink,
                            color: "transparent",
                            borderRadius: `${1 + hash(li * 7 + wi) * 2}px`,
                            padding: "0.05em 0.04em",
                          }}
                        >
                          {word}
                        </span>
                        {wi < arr.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span key={ri} style={{ color: run.kind === "label" ? RISO.pink : RISO.ink, fontWeight: run.kind === "strong" ? 700 : 400 }}>
                    {run.kind === "strong" ? (
                      <>
                        OPENING POSITION:{" "}
                        <span style={{ outline: `2.4px solid ${RISO.pink}`, outlineOffset: "0.18em", borderRadius: "50%" }}>WEAK.</span>
                      </>
                    ) : (
                      run.text
                    )}
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MunStatic() {
  const stage = useStage();
  const mobile = stage.isMobile;
  const titleFs = mobile ? Math.min(92, (stage.width - 40) / 3.95) : Math.min(230, stage.width * 0.15);
  const speechFs = mobile ? 34 : 48;
  const weights = [100, 300, 600, 900];
  const lines = [COPY.opening, ...COPY.speeches];
  const labels = [COPY.openingLabel, ...COPY.speechLabels];
  const cw = mobile ? 300 : 420;
  const ch = (cw * 0.3) / 0.9;

  return (
    <div data-mun-static className="relative overflow-hidden" style={{ background: RISO.cobalt, color: RISO.paper }}>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-16 px-5 pb-24 pt-28 md:gap-24 md:px-12 md:pt-36">
        {/* ORDER. */}
        <header className="flex flex-col items-center text-center">
          <h2 className="relative whitespace-nowrap" style={{ ...fraunces(900, 1, 0, 144), fontSize: titleFs, lineHeight: 0.82, letterSpacing: "-0.035em" }}>
            {COPY.title}
            <span className="relative inline-block" style={{ width: titleFs * 0.2, height: titleFs * 0.7 }}>
              <span className="absolute rounded-full" style={{ left: titleFs * 0.03, bottom: 0, width: titleFs * 0.15, height: titleFs * 0.15, background: RISO.sun }} />
              <GavelGlyph
                color={RISO.paper}
                className="absolute"
                style={{
                  width: titleFs * 0.5,
                  height: titleFs * 0.5,
                  left: titleFs * 0.105 - titleFs * 0.5 * 0.203,
                  top: titleFs * 0.55 - titleFs * 0.5 * 0.492 - titleFs * 0.006,
                  transform: "rotate(-44deg)",
                  transformOrigin: "20.3% 49.2%",
                }}
              />
            </span>
          </h2>
          <p className="mt-6" style={{ ...martian, fontSize: mobile ? 11 : 13, letterSpacing: "0.32em" }}>
            {COPY.titleSub}
          </p>
        </header>

        {/* the case file, and the room it was argued in */}
        <section className="grid items-center gap-14 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-16">
          <StaticPaper fs={mobile ? 12.5 : 16} />
          <div>
            <TurnedRoom mobile={mobile} />
            <p className="mt-4 flex items-center justify-center gap-3" style={{ ...martian, fontSize: mobile ? 10 : 11.5, color: RISO.sun }}>
              <span className="inline-block" style={{ width: 9, height: 9, background: RISO.sun }} />
              {COPY.turned}
            </p>
          </div>
        </section>

        {/* the oratory gains weight as the room turns */}
        <section className="flex flex-col gap-8 md:gap-10">
          {lines.map((t, i) => (
            <div key={i}>
              <p className="mb-3 flex items-center gap-3" style={{ ...martian, fontSize: mobile ? 10 : 11.5, color: RISO.sun }}>
                <span className="inline-block" style={{ width: 9, height: 9, background: RISO.sun }} />
                {labels[i]}
              </p>
              <p style={{ ...fraunces(weights[i], i === 3 ? 1 : 0, i === 0 ? 100 : 0, 144), fontSize: speechFs, lineHeight: 1.04, letterSpacing: "-0.02em" }}>{t}</p>
            </div>
          ))}
          <p style={{ ...fraunces(380, 1, 0, 144), fontStyle: "italic", fontSize: speechFs * 0.8, lineHeight: 1.1 }}>{COPY.won}</p>
        </section>

        {/* the record */}
        <section className="flex flex-col items-center gap-14">
          <div className="relative" style={{ width: cw, height: ch, marginBottom: ch * 1.35 }}>
            <div
              className="absolute inset-0 flex flex-col justify-between"
              style={{ background: RISO.sun, color: RISO.ink, padding: `${ch * 0.11}px ${cw * 0.06}px ${ch * 0.12}px`, boxShadow: `0 ${ch * 0.07}px 0 ${alpha(RISO.ink, 0.35)}` }}
            >
              <div style={{ ...martian, fontSize: Math.round(ch * 0.085), letterSpacing: "0.22em" }}>Delegate</div>
              <div style={{ ...archivo(125, 900), fontSize: ch * 0.5, lineHeight: 0.86 }}>JOSH</div>
              <div className="flex items-center gap-[0.8em]" style={{ ...martian, fontSize: Math.round(ch * 0.075), letterSpacing: "0.22em" }}>
                <span style={{ width: cw * 0.1, height: Math.max(2, ch * 0.022), background: RISO.ink, display: "inline-block" }} />
                Age 15
              </div>
            </div>
            <div className="absolute" style={{ left: cw * 0.79, top: ch * 0.5, transform: "translate(-50%, -50%) rotate(-9deg)", mixBlendMode: "multiply" }}>
              <Seal size={ch * 1.22} id="mun-seal-static" />
            </div>
            {BURST.map((b, i, arr) => (
              <div
                key={i}
                aria-hidden={i < arr.length - 1}
                className="absolute"
                style={{ left: cw * b.x, top: ch * b.y, opacity: b.o, transform: `translate(-50%, -50%) rotate(${b.r}deg)`, mixBlendMode: b.multiply ? "multiply" : "normal" }}
              >
                <ConferenceStamp fs={(mobile ? 16 : 23) * (i === arr.length - 1 ? 1.08 : 1)} shift={i + 2} />
              </div>
            ))}
          </div>
          <p className="sr-only">{COPY.award}</p>
          <p className="max-w-[16ch] text-center md:max-w-none" style={{ ...fraunces(560, 1, 0, 144), fontSize: mobile ? 40 : 64, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
            {COPY.learned}
          </p>
        </section>
      </div>
    </div>
  );
}
