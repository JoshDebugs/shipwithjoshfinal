/**
 * Every line of the MUN world, shared by the live world and the Static
 * (reduced-motion) composition. Facts are sacred: Model United Nations,
 * 2nd Best Delegate, multiple conferences, age 15, "Learned to argue before
 * I learned to code.", won arguments even from a weak opening position.
 * Committee / country / topic are never invented — they stay redacted.
 */

export const COPY = {
  title: "ORDER",
  titleSub: "Model United Nations · Age 15",
  headline: "The room turns.",

  paper: {
    stamp: "Position paper",
    header: "MODEL UNITED NATIONS",
    weak: "OPENING POSITION: WEAK.",
  },

  /** Josh's caption before he speaks. */
  opening: "Opening position: weak.",
  speeches: ["“Honourable Chair, fellow delegates—”", "“Point of information.”", "“Right of reply.”"],
  openingLabel: "The delegate · 15",
  speechLabels: ["Speech I", "Speech II", "Speech III"],

  floorOpp: "Opposition has the floor",
  floorJosh: "The chair recognises the delegate",
  turned: "The room turns.",

  won: "Found a way to win the argument anyway.",
  learned: "Learned to argue before I learned to code.",

  seal: "2ND BEST DELEGATE · MODEL UNITED NATIONS · ",
  sealCentre: "2ND",
  conferences: "MULTIPLE CONFERENCES",
  award: "2nd Best Delegate. Multiple conferences.",
} as const;

/**
 * The position paper, typed on scroll. Columns are Courier Prime cells.
 * `x` marks a redaction run: the typewriter strikes X's (the honest,
 * period way of redacting) and an ink bar slams over them. Field values are
 * never real — committee, country and topic exist only as bars.
 * The visible words in the body read "The delegation … has … no … case."
 */
export type PaperRun = { text: string; kind: "label" | "body" | "redact" | "strong" };
export type PaperLine = PaperRun[];

export const PAPER: PaperLine[] = [
  [{ text: "DELEGATE   ", kind: "label" }, { text: "Joshmann Singh, 15.", kind: "body" }],
  [{ text: "COMMITTEE  ", kind: "label" }, { text: "XXXXXXXXXXXXX", kind: "redact" }],
  [{ text: "COUNTRY    ", kind: "label" }, { text: "XXXXXXXXXX", kind: "redact" }],
  [{ text: "TOPIC      ", kind: "label" }, { text: "XXXXXXXXXXXXXXXXXX", kind: "redact" }],
  [],
  [{ text: "1. The delegation ", kind: "body" }, { text: "XXXX XXXXXXX", kind: "redact" }],
  [{ text: "   ", kind: "body" }, { text: "XXXXXXX", kind: "redact" }, { text: " has ", kind: "body" }, { text: "XXXXX XXX XXXX", kind: "redact" }],
  [{ text: "2. ", kind: "body" }, { text: "XXXXXXX XXXX", kind: "redact" }, { text: " no ", kind: "body" }, { text: "XXXXXXXXXX", kind: "redact" }],
  [{ text: "   ", kind: "body" }, { text: "XXXXXXXXXX XXX XXXXXXXX", kind: "redact" }],
  [{ text: "3. ", kind: "body" }, { text: "XXXX XXXXX XXXXXXX", kind: "redact" }, { text: " case.", kind: "body" }],
  [],
  [{ text: COPY.paper.weak, kind: "strong" }],
];

export const PAPER_COLS = 34;

/** Accessible summary of the paper (the typed glyphs are decorative). */
export const PAPER_SUMMARY =
  "Position paper, Model United Nations. Delegate: Joshmann Singh, 15. Committee, country and topic: redacted. Most of the body: redacted. Opening position: weak.";
