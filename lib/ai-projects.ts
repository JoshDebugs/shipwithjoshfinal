// ─────────────────────────────────────────────────────────────
// AI BUILDS — placeholder data.
// Replace each entry below with your real A-tier AI projects.
// Required: name, description, stack, status. Optional: image, href.
// Status values: "shipped" | "wip" | "archived" | "open-source"
// ─────────────────────────────────────────────────────────────

export type LabStatus = "shipped" | "wip" | "archived" | "open-source";

export type LabProject = {
  id: string;
  index: string;
  name: string;
  description: string;
  stack: string[];
  status: LabStatus;
  image?: string;
  href?: string;
};

export const labProjects: LabProject[] = [
  {
    id: "lab-01",
    index: "01",
    name: "Trading Co-pilot",
    description:
      "AI overlay that watches charts, flags broken setups, drafts confidence-scored bets.",
    stack: ["Next.js", "Anthropic", "Charts", "Tool use"],
    status: "wip",
  },
  {
    id: "lab-02",
    index: "02",
    name: "Git CLI Agent",
    description:
      "Local CLI that drafts commit messages from your staged diff. No more `wip fix`.",
    stack: ["TypeScript", "Anthropic SDK", "Bun"],
    status: "open-source",
  },
  {
    id: "lab-03",
    index: "03",
    name: "Thread Forge",
    description:
      "Paste a blog post in, get a tight Twitter thread out. Stream as it generates.",
    stack: ["Next.js", "Vercel AI SDK", "Streaming"],
    status: "shipped",
  },
  {
    id: "lab-04",
    index: "04",
    name: "Inbox Triage",
    description:
      "Gmail agent that ranks importance, drafts replies, surfaces what to actually open.",
    stack: ["Vercel AI SDK", "Gmail API", "OAuth"],
    status: "wip",
  },
  {
    id: "lab-05",
    index: "05",
    name: "Strategy Backtester",
    description:
      "Type a strategy in plain English, get a backtest run on historical data.",
    stack: ["Python", "FastAPI", "OpenAI"],
    status: "archived",
  },
  {
    id: "lab-06",
    index: "06",
    name: "Architecture Sketcher",
    description:
      "Describe a system, get a mermaid diagram. Iterate by chatting at the diagram.",
    stack: ["Next.js", "Anthropic", "Mermaid"],
    status: "shipped",
  },
  {
    id: "lab-07",
    index: "07",
    name: "Voice Journal",
    description:
      "Speak into the void; AI structures it into searchable second-brain entries.",
    stack: ["Whisper", "Claude", "Supabase"],
    status: "wip",
  },
  {
    id: "lab-08",
    index: "08",
    name: "Support Agent",
    description:
      "Drop your docs, get a support agent that answers in your brand voice. RAG-backed.",
    stack: ["RAG", "Pinecone", "Anthropic"],
    status: "shipped",
  },
  {
    id: "lab-09",
    index: "09",
    name: "Prompt Workshop",
    description:
      "Prompt versioning + A/B testing for product teams. Diff outputs side-by-side.",
    stack: ["Next.js", "Postgres", "Vercel AI SDK"],
    status: "open-source",
  },
  {
    id: "lab-10",
    index: "10",
    name: "Fact Checker",
    description:
      "Browser extension that fact-checks tweets via web search + LLM verdicts.",
    stack: ["Chrome ext", "OpenAI", "Brave Search"],
    status: "archived",
  },
];
