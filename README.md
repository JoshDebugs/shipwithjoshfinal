# shipwithjosh.com

Personal site of Joshmann Singh: work, case studies, a monthly now page, a study roadmap, and **/life**, a scroll-driven film through twelve worlds.

## Stack

- [Next.js 15](https://nextjs.org) (App Router), React 19, TypeScript
- Tailwind CSS v4
- framer-motion, Lenis (smooth scroll), GSAP (shared ticker)
- three.js with React Three Fiber (the /life worlds)
- React Flow with dagre (the roadmap mind map)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
```

## Routes

| Route | What it is |
| --- | --- |
| `/` | Home: hero, work, principles, stack, lab, contact |
| `/work/[slug]` | Case studies |
| `/now` | What I'm doing now, updated monthly |
| `/roadmap` | Study roadmap as an interactive mind map |
| `/life` | The life film: a hero, then twelve worlds joined by portal dives |
| `/life/lab`, `/life/lab/<world>` | Development only: preview a single world |

## Project structure

```
app/                    routes (App Router), root layout, page transition, API
components/
  layout/               app shell: frame, top nav, intro, cursor, swipe navigation
  home/                 home page sections
  case-study/           case-study body
  roadmap/              roadmap mind map
  ui/                   shared primitives (ScrollReveal, Magnetic, Marquee)
  life/                 /life
    multiverse/         the film: stage, portals, runtime, HUD, dev labs
    worlds/             one folder per world (meta, World, Static, scene code)
lib/
  data/                 site content: projects, lab builds, roadmap
  motion.ts             shared animation presets
  intro.ts              intro overlay state
public/assets/          images
docs/                   design notes for /life
```

## Editing content

- Projects and case studies: `lib/data/projects.ts`
- Lab builds: `lib/data/ai-projects.ts`
- Roadmap: `lib/data/roadmap.ts` (progress in `roadmap-status.json`, saved from the roadmap page in development)
- Now page: `app/now/page.tsx`
