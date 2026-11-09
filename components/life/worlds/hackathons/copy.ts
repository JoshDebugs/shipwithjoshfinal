/** Every line of the world, in one place (facts are sacred: spec §5 · 11). */

export const COPY = {
  headline: "BUILD. BREAK. PITCH. REPEAT.",
  verbs: ["BUILD", "BREAK", "PITCH", "REPEAT"] as const,
  url: "localhost:3000/hackathons",
  rawTitle: "Hackathons",
  rawLine: "localhost:3000/hackathons, v0.0.1. It compiles. Barely.",
  error: "ReferenceError: sleep is not defined",
  errorWink: "(Relax, this one's on purpose.)",
  git: "git reset --hard",
  gitComment: "# see you at the next one",
  gitOut: "HEAD is now at 0a1b2c3 v0.0.1",
} as const;

export type EventFact = {
  /** Exact event name. */
  name: string;
  /** Title broken into lines for the cards / slides. */
  lines: string[];
  /** Exact result. */
  result: string;
  /** Optional coda (Smart India). */
  note?: string;
  /** Inspector tag shown in debug mode. */
  tag: string;
};

export const EVENTS: EventFact[] = [
  {
    name: "IIT Roorkee Productathon",
    lines: ["IIT Roorkee", "Productathon"],
    result: "~4th",
    tag: '<ResultCard place="~4th" />',
  },
  {
    name: "Ashoka University Fashion Design Hackathon",
    lines: ["Ashoka University", "Fashion Design", "Hackathon"],
    result: "2nd",
    tag: '<ResultCard place="2nd" />',
  },
  {
    name: "Smart India Hackathon",
    lines: ["Smart India", "Hackathon"],
    result: "participated.",
    note: "Honest commit.",
    tag: '<ResultCard status="participated" />',
  },
];

/** The honest commit ticker. */
export const COMMITS: [string, string][] = [
  ["a1f3c9e", "init"],
  ["7be0d21", "wip"],
  ["c44a9f0", "fix"],
  ["0d9e7b3", "fix again"],
  ["e51c2aa", "it works don't touch it"],
  ["9f02b6d", "final_final_v3"],
  ["3ac7e18", "pls"],
  ["b6d4401", "remove sleep()"],
  ["f00dcaf", "demo in 5"],
  ["d1e7c35", "it's a feature"],
  ["58b2e9a", "ship it"],
];

/** Fake source shown in the runtime error sheet (original, not any framework's overlay). */
export const STACK = [
  { n: 46, code: "  const idea = await brainstorm();" },
  { n: 47, code: "  const team = await assemble();" },
  { n: 48, code: "  await sleep(8 * HOURS);", hot: true },
  { n: 49, code: "  return ship(idea, team);" },
];
