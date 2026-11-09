"use client";

/** The raw v0.0.1 page, the mini-editor, the error sheet, toasts and the git terminal. */
import type { CSSProperties } from "react";
import { C, FONT, RAW, alpha } from "./colors";
import { COPY, EVENTS, STACK } from "./copy";
import type { Geo } from "./geometry";
import type { Refs } from "./engine";

/* ------------------------------------------------------------------- raw */

export function RawPage({ g, R }: { g: Geo; R: Refs }) {
  const r = g.raw;
  const fadeRef = (k: number) => (el: HTMLElement | null) => {
    R.rawFade[k] = el;
  };
  return (
    <div
      aria-hidden
      ref={(el) => {
        R.raw = el;
      }}
      className="absolute flex flex-col justify-center"
      style={{ left: r.x, top: r.top, width: r.w, height: r.bottom - r.top, color: RAW.text, fontFamily: RAW.serif }}
    >
      <div style={{ fontSize: r.h1, fontWeight: 700, lineHeight: 1.08, margin: 0 }}>
        {COPY.rawTitle.split("").map((c, k) => (
          <span
            key={k}
            ref={(el) => {
              R.rawChars[k] = el;
            }}
          >
            {c}
          </span>
        ))}
      </div>
      <p
        ref={fadeRef(0)}
        style={{ fontSize: r.body, lineHeight: 1.3, margin: `${0.5 * r.body}px 0 ${0.75 * r.body}px` }}
      >
        {COPY.rawLine}
      </p>
      <ul ref={fadeRef(1)} style={{ fontSize: r.li, lineHeight: 1.35, margin: 0, paddingLeft: "1.4em", listStyle: "disc" }}>
        {EVENTS.map((e, k) => (
          <li key={e.name}>
            <span
              ref={(el) => {
                R.rawLinks[k] = el;
              }}
              style={{ color: RAW.link, textDecoration: "underline", textUnderlineOffset: "0.08em" }}
            >
              {e.name}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-end" style={{ gap: r.body, marginTop: r.body }}>
        <div
          ref={(el) => {
            R.rawBox = el;
          }}
          className="relative shrink-0"
          style={{ width: r.boxW, height: r.boxH, background: RAW.box, border: `1px solid ${RAW.boxLine}` }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <path d="M0 0 L100 100 M100 0 L0 100" stroke={RAW.boxLine} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <span
          ref={fadeRef(2)}
          style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: r.btn, padding: `${r.btn * 0.14}px ${r.btn * 0.5}px`, background: RAW.button, border: `1px solid ${RAW.buttonLine}`, borderRadius: 3 }}
        >
          Submit
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- editor */

export function Editor({ g, R }: { g: Geo; R: Refs }) {
  const u = g.u;
  const fs = Math.round((g.mobile ? 13.5 : 17) * u);
  const lh = Math.round(fs * 1.65);
  const gut: CSSProperties = { width: fs * 2.6, flex: "none", color: alpha(C.paper, 0.32), textAlign: "right", paddingRight: fs * 0.9 };
  const line: CSSProperties = { display: "flex", height: lh, alignItems: "center", paddingRight: fs, whiteSpace: "pre" };
  return (
    <div
      aria-hidden
      ref={(el) => {
        R.editor = el;
      }}
      className="absolute"
      style={{
        left: g.editor.x,
        top: g.editor.y,
        width: g.editor.w,
        height: g.editor.h,
        background: C.ink,
        color: C.paper,
        border: `${Math.max(2, Math.round(3 * u))}px solid ${C.ink}`,
        boxShadow: `${Math.round(10 * u)}px ${Math.round(10 * u)}px 0 ${C.pink}`,
        fontFamily: FONT.mono,
        fontSize: fs,
        visibility: "hidden",
        willChange: "transform",
      }}
    >
      <div className="flex items-center justify-between" style={{ height: Math.round(36 * u), padding: `0 ${Math.round(12 * u)}px`, background: C.inkLift2, fontSize: Math.round(fs * 0.82) }}>
        <div className="flex items-center" style={{ gap: Math.round(8 * u) }}>
          {[C.pink, C.sun, C.teal].map((c) => (
            <i key={c} className="inline-block rounded-full" style={{ width: Math.round(9 * u), height: Math.round(9 * u), background: c }} />
          ))}
          <span style={{ marginLeft: Math.round(6 * u), opacity: 0.85 }}>poster.css</span>
          <span
            ref={(el) => {
              R.editorDirty = el;
            }}
            style={{ color: C.sun }}
          >
            ●
          </span>
        </div>
        <span
          ref={(el) => {
            R.editorStatus = el;
          }}
          style={{ color: C.sun, fontWeight: 700 }}
        />
      </div>
      <div style={{ padding: `${Math.round(10 * u)}px 0` }}>
        <div style={line}>
          <span style={gut}>41</span>
          <span>
            <span style={{ color: C.sun }}>.poster</span> {"{"}
          </span>
        </div>
        <div
          ref={(el) => {
            R.editorLineBg = el;
          }}
          style={{ ...line, background: alpha(C.pink, 0) }}
        >
          <span style={{ ...gut, color: C.pink }}>42</span>
          <span style={{ color: C.pink, fontWeight: 700 }}>
            <span
              ref={(el) => {
                R.editorTyped = el;
              }}
            />
            <span
              ref={(el) => {
                R.editorCaret = el;
              }}
              style={{ display: "inline-block", width: "0.55em", height: "1.05em", marginLeft: 1, background: C.paper, verticalAlign: "text-bottom" }}
            />
          </span>
        </div>
        <div style={line}>
          <span style={gut}>43</span>
          <span style={{ opacity: 0.75 }}>
            {"  "}gap: <span style={{ color: C.sun }}>var(--gap)</span>;
          </span>
        </div>
        <div style={line}>
          <span style={gut}>44</span>
          <span>{"}"}</span>
        </div>
      </div>
      <div
        ref={(el) => {
          R.editorKey = el;
        }}
        className="absolute grid place-items-center"
        style={{
          right: Math.round(14 * u),
          bottom: Math.round(14 * u),
          width: Math.round(58 * u),
          height: Math.round(44 * u),
          background: C.sun,
          color: C.ink,
          border: `2px solid ${C.ink}`,
          boxShadow: `0 ${Math.round(4 * u)}px 0 ${C.paper}`,
          fontFamily: FONT.mono,
          fontWeight: 800,
          fontSize: Math.round(19 * u),
          opacity: 0,
        }}
      >
        ⌘S
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- error sheet */

export function ErrorSheet({ g, R }: { g: Geo; R: Refs }) {
  const u = g.u;
  const fsHead = Math.round((g.mobile ? 30 : 46) * u);
  const fsWink = Math.round((g.mobile ? 15.5 : 22) * u);
  const fsCode = Math.round((g.mobile ? 12 : 16.5) * u);
  const lh = Math.round(fsCode * 1.62);
  const pad = Math.round((g.mobile ? 16 : 26) * u);
  return (
    <div
      ref={(el) => {
        R.sheet = el;
      }}
      className="absolute overflow-hidden"
      style={{
        left: g.sheet.x,
        top: g.sheet.y,
        width: g.sheet.w,
        padding: pad,
        background: C.pink,
        color: C.paper,
        border: `${Math.max(3, Math.round(4 * u))}px solid ${C.ink}`,
        boxShadow: `${Math.round(10 * u)}px ${Math.round(12 * u)}px 0 ${C.ink}`,
        visibility: "hidden",
        willChange: "transform",
      }}
    >
      <div className="flex items-center justify-between" style={{ fontFamily: FONT.mono, fontSize: Math.round((g.mobile ? 11.5 : 14) * u), fontWeight: 700, color: C.ink, marginBottom: Math.round(12 * u) }}>
        <span>✕ Runtime error · 1 of 1</span>
        <span>hackathons/page.tsx</span>
      </div>
      <div
        style={{
          fontFamily: FONT.anybody,
          fontWeight: 900,
          fontSize: fsHead,
          lineHeight: 1.02,
          fontVariationSettings: g.mobile ? '"wdth" 75' : '"wdth" 88',
          textShadow: `${Math.round(3 * u)}px ${Math.round(3 * u)}px 0 ${C.ink}`,
        }}
      >
        {COPY.error}
      </div>
      <div style={{ fontFamily: FONT.mono, fontWeight: 700, color: C.ink, fontSize: fsWink, marginTop: Math.round(10 * u), lineHeight: 1.25 }}>{COPY.errorWink}</div>
      {g.sheetLines > 0 && (
        <div style={{ marginTop: Math.round(16 * u), background: C.ink, color: C.paper, fontFamily: FONT.mono, fontSize: fsCode, padding: `${Math.round(10 * u)}px 0` }}>
          {STACK.filter((l) => g.sheetLines === 4 || l.hot).map((l) => (
            <div key={l.n} className="flex" style={{ height: lh, alignItems: "center", background: l.hot ? alpha(C.pink, 0.32) : undefined, whiteSpace: "pre" }}>
              <span style={{ width: fsCode * 3.2, flex: "none", textAlign: "right", paddingRight: fsCode, color: l.hot ? C.pink : alpha(C.paper, 0.4), fontWeight: l.hot ? 800 : 400 }}>{l.hot ? `> ${l.n}` : l.n}</span>
              <span style={{ color: l.hot ? C.sun : C.paper, opacity: l.hot ? 1 : 0.8 }}>{l.code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- toasts */

export function Toasts({ g, R }: { g: Geo; R: Refs }) {
  const u = g.u;
  const labels = ["colors.css", "type.css", "motion.css"];
  const fs = Math.round((g.mobile ? 11.5 : 13.5) * u);
  return (
    <div aria-hidden className="pointer-events-none absolute left-0 top-0">
      {labels.map((l, k) => {
        const y = g.toast.y;
        const x = g.toast.x + k * (g.toast.w + g.toast.gap);
        return (
          <div
            key={l}
            ref={(el) => {
              R.toasts[k] = el;
            }}
            className="absolute flex items-center justify-center"
            style={{
              left: x,
              top: y,
              width: g.toast.w,
              height: g.toast.h,
              gap: Math.round(7 * u),
              background: C.ink,
              color: C.paper,
              fontFamily: FONT.mono,
              fontSize: fs,
              fontWeight: 600,
              boxShadow: `${Math.round(3 * u)}px ${Math.round(3 * u)}px 0 ${C.sun}`,
              opacity: 0,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: C.sun, fontWeight: 800 }}>✓</span>
            {l}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- terminal */

export function Terminal({ g, R }: { g: Geo; R: Refs }) {
  const u = g.u;
  const fs = Math.round((g.mobile ? 12.5 : 21) * u);
  const pad = Math.round((g.mobile ? 12 : 18) * u);
  return (
    <div
      ref={(el) => {
        R.term = el;
      }}
      className="absolute overflow-hidden"
      style={{
        left: g.terminal.x,
        top: g.terminal.y,
        width: g.terminal.w,
        height: g.terminal.h,
        background: C.inkLift,
        color: C.sun,
        border: `2px solid ${alpha(C.paper, 0.32)}`,
        fontFamily: FONT.mono,
        fontSize: fs,
        boxShadow: `${Math.round(8 * u)}px ${Math.round(8 * u)}px 0 ${alpha(C.sun, 0.9)}`,
        visibility: "hidden",
        willChange: "transform",
      }}
    >
      <div className="flex items-center" style={{ height: Math.round(30 * u), padding: `0 ${pad}px`, gap: Math.round(7 * u), background: C.inkLift2, color: C.paper, fontSize: Math.round(fs * 0.68) }}>
        {[C.pink, C.sun, C.teal].map((c) => (
          <i key={c} className="inline-block rounded-full" style={{ width: Math.round(8 * u), height: Math.round(8 * u), background: c }} />
        ))}
        <span style={{ marginLeft: 4 * u, opacity: 0.75 }}>~/hackathons</span>
      </div>
      <div style={{ padding: `${Math.round(12 * u)}px ${pad}px`, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        <div>
          <span style={{ color: C.paper, opacity: 0.6 }}>$ </span>
          <span
            ref={(el) => {
              R.termTyped = el;
            }}
            style={{ fontWeight: 700 }}
          />
          <span
            ref={(el) => {
              R.termComment = el;
            }}
            style={{ color: C.paper, opacity: 0.6 }}
          />
          <span
            ref={(el) => {
              R.termCaret = el;
            }}
            style={{ display: "inline-block", width: "0.55em", height: "1.05em", marginLeft: 2, background: C.sun, verticalAlign: "text-bottom" }}
          />
        </div>
        <div
          ref={(el) => {
            R.termOut = el;
          }}
          style={{ color: C.paper, opacity: 0, fontSize: Math.round(fs * 0.86), marginTop: 2 * u }}
        >
          {COPY.gitOut}
        </div>
      </div>
    </div>
  );
}
