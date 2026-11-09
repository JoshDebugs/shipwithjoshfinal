/**
 * An original 5-row pixel alphabet — only the glyphs this world needs.
 *
 * Every anamorphic voxel word is built from these bitmaps (one cube per lit
 * cell), and the reduced-motion / no-WebGL versions draw the same bitmaps as
 * SVG, so the letterforms are ours and never a game font.
 */

const G: Record<string, string[]> = {
  A: [".XX.", "X..X", "XXXX", "X..X", "X..X"],
  B: ["XXX.", "X..X", "XXX.", "X..X", "XXX."],
  C: [".XXX", "X...", "X...", "X...", ".XXX"],
  D: ["XXX.", "X..X", "X..X", "X..X", "XXX."],
  E: ["XXXX", "X...", "XXX.", "X...", "XXXX"],
  G: [".XXX", "X...", "X.XX", "X..X", ".XXX"],
  I: ["X", "X", "X", "X", "X"],
  K: ["X..X", "X.X.", "XX..", "X.X.", "X..X"],
  L: ["X..", "X..", "X..", "X..", "XXX"],
  M: ["X...X", "XX.XX", "X.X.X", "X...X", "X...X"],
  N: ["X..X", "XX.X", "X.XX", "X..X", "X..X"],
  O: [".XX.", "X..X", "X..X", "X..X", ".XX."],
  P: ["XXX.", "X..X", "XXX.", "X...", "X..."],
  R: ["XXX.", "X..X", "XXX.", "X.X.", "X..X"],
  S: [".XXX", "X...", ".XX.", "...X", "XXX."],
  T: ["XXX", ".X.", ".X.", ".X.", ".X."],
  V: ["X...X", "X...X", ".X.X.", ".X.X.", "..X.."],
  W: ["X...X", "X...X", "X.X.X", "XX.XX", "X...X"],
  Y: ["X.X", "X.X", ".X.", ".X.", ".X."],
  "~": [".....", ".X...", "X.X.X", "...X.", "....."],
  "4": ["X..X", "X..X", "XXXX", "...X", "...X"],
  "0": [".XX.", "X..X", "X..X", "X..X", ".XX."],
  ".": [".", ".", ".", ".", "X"],
  " ": ["..", "..", "..", "..", ".."],
};

export const GLYPH_ROWS = 5;

/** A lit-cell bitmap: `cells` are [col, row] pairs, origin top-left. */
export type Bitmap = { cols: number; rows: number; cells: [number, number][] };

/** Lay out lines of text (centred per line) into one bitmap. */
export function textBitmap(lines: string[], lineGap = 2): Bitmap {
  const widths = lines.map((l) =>
    [...l].reduce((w, ch, i) => w + (G[ch] ?? G[" "])[0].length + (i > 0 ? 1 : 0), 0),
  );
  const cols = Math.max(...widths);
  const rows = lines.length * GLYPH_ROWS + (lines.length - 1) * lineGap;
  const cells: [number, number][] = [];
  lines.forEach((line, li) => {
    let x = Math.floor((cols - widths[li]) / 2);
    const y0 = li * (GLYPH_ROWS + lineGap);
    [...line].forEach((ch) => {
      const g = G[ch] ?? G[" "];
      for (let r = 0; r < GLYPH_ROWS; r++)
        for (let c = 0; c < g[r].length; c++) if (g[r][c] === "X") cells.push([x + c, y0 + r]);
      x += g[0].length + 1;
    });
  });
  return { cols, rows, cells };
}

/** The receipt silhouette (the next world's portal icon) as a voxel bitmap: 9 × 15, sawtooth bottom. */
export function receiptBitmap(): Bitmap {
  const cols = 9;
  const rows = 15;
  const cells: [number, number][] = [];
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
  for (let c = 0; c < cols; c += 2) cells.push([c, rows - 1]);
  return { cols, rows, cells };
}
