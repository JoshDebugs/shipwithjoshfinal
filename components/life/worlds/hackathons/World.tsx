"use client";

/**
 * 11 · Hackathons — "Hot Reload".
 *
 * This world doesn't show a hackathon, it is one. The stage boots as raw,
 * unstyled HTML, a paint bucket installs the CSS, one deleted line of CSS
 * drops the whole poster into a rainbow-outlined heap, a hot reload springs it
 * back as a projected pitch, and `git reset --hard` rewinds the film to the
 * raw page. The last placeholder box becomes the thumbprint the Outro opens from.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useIsoLayoutEffect, usePointer, usePortalOrigin, useProgress, useScrollVelocity, useStage, useTicker } from "@/components/life/multiverse/runtime";
import type { WorldProps } from "@/components/life/multiverse/types";
import { Bucket, Cursors, Finale, Floods, Projector, Rings, StatusBar, VHS } from "./Chrome";
import { C, FONT, RAW, alpha } from "./colors";
import { COPY, EVENTS } from "./copy";
import { Engine, emptyRefs, type PointerRead } from "./engine";
import { computeGeo } from "./geometry";
import { meta } from "./meta";
import { Editor, ErrorSheet, RawPage, Terminal, Toasts } from "./Panels";
import { PieceNode } from "./Pieces";
import { Slides } from "./Slides";

export default function HackathonsWorld({ progress }: WorldProps) {
  const stage = useStage();
  const origin = usePortalOrigin();
  const velocity = useScrollVelocity();
  const pointer = usePointer();
  const refs = useRef(emptyRefs());
  const engine = useMemo(() => new Engine(refs.current), []);
  const W = Math.max(1, stage.width);
  const H = Math.max(1, stage.height);
  const g = useMemo(() => computeGeo(W, H), [W, H]);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const read = () => setFine(mq.matches && !stage.isMobile);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, [stage.isMobile]);

  useIsoLayoutEffect(() => {
    engine.setGeo(g, stage.lowPower, fine);
    engine.measure();
    engine.frame(progress.get());
    let live = true;
    document.fonts?.ready.then(() => {
      if (!live) return;
      engine.measure();
      engine.frame(progress.get());
    });
    return () => {
      live = false;
    };
  }, [g, engine, progress, stage.lowPower, fine]);

  useEffect(() => () => engine.dispose(), [engine]);

  useProgress(progress, (p) => engine.frame(p));

  const ptr = useRef<PointerRead>({ x: 0, y: 0, inside: false, mouse: false });
  useTicker((t, dt) => {
    ptr.current.x = pointer.x.get();
    ptr.current.y = pointer.y.get();
    ptr.current.inside = pointer.inside.get() > 0;
    ptr.current.mouse = pointer.type.current === "mouse" && fine;
    engine.tick(t, dt, velocity.get(), ptr.current);
  });

  const R = refs.current;
  const u = g.u;

  return (
    <div
      ref={(el) => {
        R.root = el;
      }}
      className="absolute inset-0 overflow-hidden"
      style={{ background: meta.bg, color: RAW.text }}
    >
      {/* Semantic content: the pieces below are decorative clones of this. */}
      <div className="sr-only">
        <p>Hackathons, age 18. {COPY.rawLine}</p>
        <ol>
          {EVENTS.map((e) => (
            <li key={e.name}>
              {e.name}: {e.result} {e.note ?? ""}
            </li>
          ))}
        </ol>
        <p>
          {COPY.error}. {COPY.errorWink}
        </p>
        <p>
          $ {COPY.git} {COPY.gitComment}
        </p>
      </div>

      {/* the room behind the page: dark until the page becomes a slide */}
      <div aria-hidden className="absolute inset-0" style={{ background: C.ink }} />

      <div
        ref={(el) => {
          R.page = el;
        }}
        className="absolute inset-0 overflow-hidden"
        style={{ background: RAW.page, transformOrigin: "50% 50%" }}
      >
        <div
          aria-hidden
          ref={(el) => {
            R.ground = el;
          }}
          className="absolute inset-0"
          style={{ background: C.paper, visibility: "hidden" }}
        />
        <Floods g={g} R={R} />
        <RawPage g={g} R={R} />
        {g.pieces.map((def, i) => (
          <PieceNode key={def.id} def={def} i={i} g={g} R={R} />
        ))}
        <Rings g={g} R={R} />
        <Slides g={g} R={R} />
      </div>

      <div
        aria-hidden
        ref={(el) => {
          R.vignette = el;
        }}
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0, background: `radial-gradient(115% 100% at 50% 44%, ${alpha(C.pink, 0)} 55%, ${alpha(C.pink, 0.42)} 100%)` }}
      />
      <Editor g={g} R={R} />
      <ErrorSheet g={g} R={R} />
      <Toasts g={g} R={R} />

      <div
        aria-hidden
        ref={(el) => {
          R.dim = el;
        }}
        className="pointer-events-none absolute inset-0"
        style={{ background: C.ink, opacity: 0 }}
      />
      <Projector g={g} R={R} />

      <div
        aria-hidden
        ref={(el) => {
          R.reloadPill = el;
        }}
        className="pointer-events-none absolute"
        style={{
          left: g.pill.x,
          top: g.pill.y,
          padding: `${Math.round(7 * u)}px ${Math.round(16 * u)}px`,
          background: C.ink,
          color: C.sun,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: Math.round((g.mobile ? 12 : 16) * u),
          whiteSpace: "nowrap",
          opacity: 0,
          boxShadow: `${Math.round(4 * u)}px ${Math.round(4 * u)}px 0 ${C.sun}`,
        }}
      >
        ↻ hot reload · 1 file changed · 94ms
      </div>

      <Terminal g={g} R={R} />
      <Finale g={g} R={R} origin={origin} />
      <Bucket g={g} R={R} />

      <div
        aria-hidden
        ref={(el) => {
          R.grain = el;
        }}
        className="riso-grain"
        style={{ opacity: 0 }}
      />
      <VHS g={g} R={R} />
      <Cursors g={g} R={R} />
      <StatusBar g={g} R={R} />
    </div>
  );
}
