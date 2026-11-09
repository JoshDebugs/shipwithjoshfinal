/**
 * What each receipt row prints. Shared by the live world (where the engine
 * sweeps the ink in and develops it) and the static, reduced-motion receipt.
 *
 * Sizes come from CSS variables set on the receipt (`--fs-*`, `--pad`).
 */
import type { CSSProperties, ReactNode } from "react";
import { C } from "./colors";
import { Barcode, DotText, Money } from "./glyphs";
import type { Row } from "./rows";

const DOTO: CSSProperties = { fontFamily: "var(--f-doto)", fontWeight: 900, lineHeight: 1, fontVariationSettings: '"ROND" var(--rond, 100)' };
const MONO: CSSProperties = { fontFamily: "var(--f-space-mono)", lineHeight: 1 };

const line: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  paddingLeft: "var(--pad)",
  paddingRight: "var(--pad)",
  color: C.ink,
  whiteSpace: "nowrap",
};

function Leader() {
  return (
    <span aria-hidden style={{ flex: 1, minWidth: 12, overflow: "hidden", margin: "0 0.55em", opacity: 0.5, letterSpacing: "0.08em" }}>
      {"·".repeat(90)}
    </span>
  );
}

export function RowInk({ row, children }: { row: Row; children?: ReactNode }) {
  switch (row.kind) {
    case "gap":
      return children ? <div style={line}>{children}</div> : null;

    case "stars":
      return (
        <div style={{ ...line, ...DOTO, justifyContent: "center", fontSize: "var(--fs-stars)", letterSpacing: "0.06em" }}>{row.text}</div>
      );

    case "head":
      return (
        <div style={{ ...line, ...DOTO, justifyContent: "center", fontSize: "var(--fs-head)" }}>
          <DotText text={row.text ?? ""} />
        </div>
      );

    case "meta":
      return (
        <div style={{ ...line, ...MONO, justifyContent: "center", fontSize: "var(--fs-meta)", letterSpacing: "0.08em" }}>{row.text}</div>
      );

    case "rule1":
    case "rule2":
      return (
        <div aria-hidden style={{ ...line, flexDirection: "column", justifyContent: "center", gap: 3 }}>
          <span style={{ display: "block", width: "100%", height: 1.5, background: `repeating-linear-gradient(90deg, ${C.ink} 0 6px, transparent 6px 10px)` }} />
          {row.kind === "rule2" && (
            <span style={{ display: "block", width: "100%", height: 1.5, background: `repeating-linear-gradient(90deg, ${C.ink} 0 6px, transparent 6px 10px)` }} />
          )}
        </div>
      );

    case "itemno":
      return (
        <div style={{ ...line, ...MONO, fontSize: "var(--fs-itemno)", letterSpacing: "0.06em" }}>
          <span>{row.text}</span>
          <Leader />
          <span>{row.right}</span>
        </div>
      );

    case "name":
      return <div style={{ ...line, ...DOTO, fontSize: "var(--fs-name)", letterSpacing: "0.02em" }}>{row.text}</div>;

    case "desc":
      return (
        <div style={{ ...line, ...MONO, fontWeight: 700, fontSize: "var(--fs-desc)", letterSpacing: "0.02em" }}>{row.text}</div>
      );

    case "amount":
    case "total":
      return (
        <div style={{ ...line, ...MONO, fontSize: "var(--fs-desc)", fontWeight: row.kind === "total" ? 700 : 400 }}>
          <span>{row.text}</span>
          <Leader />
          <span style={{ ...DOTO, fontSize: "var(--fs-money)", position: "relative" }}>
            {row.money ? <Money amount={row.money} /> : row.right}
            {children}
          </span>
        </div>
      );

    case "note":
      return (
        <div style={{ ...line, ...DOTO, fontSize: "var(--fs-note)", gap: "0.6em" }}>
          <span>
            <DotText text={row.text ?? ""} />
          </span>
          {row.money && <Money amount={row.money} />}
          <span>
            <DotText text={row.right ?? ""} />
          </span>
        </div>
      );

    case "thanks":
      return (
        <div style={{ ...line, ...DOTO, justifyContent: "center", fontSize: "var(--fs-thanks)", letterSpacing: "0.04em" }}>
          <DotText text={row.text ?? ""} />
        </div>
      );

    case "barcode":
      return (
        <div style={{ ...line, justifyContent: "center", paddingTop: 3, paddingBottom: 3 }}>
          <div style={{ width: "78%", height: "100%", position: "relative" }}>
            <Barcode />
            {children}
          </div>
        </div>
      );

    case "digits":
      return (
        <div style={{ ...line, ...MONO, justifyContent: "center", fontSize: "var(--fs-digits)", letterSpacing: "0.32em" }}>{row.text}</div>
      );
  }
}
