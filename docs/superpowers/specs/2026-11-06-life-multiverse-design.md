# Life of Josh — "Multiverse" redesign: design + build spec

Date: 2026-11-06 · Status: approved by Josh ("put everything in website now, so I can describe changes")

## 1. What was decided (do not re-litigate)

- **Scope.** `/life` keeps its hero exactly as-is (THE LIFE OF JOSH → scroll typewriter → "Here's the gist of it."). Everything after it is rebuilt as **11 worlds + an outro**, in age order.
- **Motive.** "Every obsession was its own universe." Each world has a radically different art direction (type, textures, motion language, hero moment), with crazy design elements. Inside each world, restraint frames the spectacle: one hero moment, everything else supports it.
- **Spine: Portal Dive (smooth).** Each world ends with the next world's icon opening out of it; scrolling dives through. The dive is the approved *smooth* version: long ease-in-out, the old world drifts closer and dims, the new world counter-zooms. **No strobe flashes, no white frames, no screen inversions anywhere on the page.** Impacts are expressed with easing, scale, settle and halftone rings; screen shake, if any, ≤ 2px and rare.
- **One palette for the whole page: Riso Print.** Josh rejected "too colorful" and a chameleon HUD. Use ONLY:
  `paper #F1EADB · ink #1B1A17 · pink #FF4F9A · sun #FFB81F · teal #00897B · cobalt #3F5BF2`
  plus shades derived the way riso ink behaves: `overprint(a,b)` (multiply), `mix()`, `alpha()`, `ramp()` from `components/life/multiverse/palette.ts`. Each world *leads* with a different pair. The site's lime `#c5ff3d` is NOT in this palette — every concept mention of lime/tangerine/ultramarine/tomato/etc. must be remapped to Riso inks (see each world below). One exception: Hackathons' cold-open shows browser-default white/Times/link-blue on purpose.
- **HUD.** One calm ink pill (bottom-right of the stage), same style everywhere. Already built — worlds do not build HUDs that compete with it (in-world diegetic readouts are fine).
- **All visuals from code.** No photos, video files, external images, HDR files or CDN assets. `drei <Environment preset=…>` is forbidden (it downloads HDRs) — build environments from `<Lightformer>`s.
- **Go all out**, including live three.js where it earns it — but every world must run on a phone.
- **Copy:** facts are sacred (exact numbers/names/places); wording may be sharpened. Real startups replace the old placeholders.

## 2. Architecture (built — read the code, don't change it)

All foundation code lives in `components/life/multiverse/`:

| File | What it gives you |
|---|---|
| `Multiverse.tsx` | The film engine. One tall section + one sticky stage. Scroll → global time `u` (stage heights) → each world's `progress` 0→1, then a portal dive into the next world. Mounts only current ±1 worlds. Reduced motion → each world's `Static` in normal flow. |
| `types.ts` | `WorldMeta`, `WorldModule { meta, World, Static }`, `WorldProps { progress: MotionValue<number> }`, `Presence`. |
| `runtime.tsx` | `useStage()` (width, height, isMobile, lowPower, reduced, ref), `useWorld()` (meta, presence, running, active), `usePortalOrigin()`, `useTicker(cb)`, `useProgress(progress, cb)`, `usePointer()`, `useScrollVelocity()`, `useIsoLayoutEffect`. |
| `LazyCanvas.tsx` | The ONLY way to create a three.js canvas. Code-split, mounts only while the world is current/entering/next, renders only while on screen, DPR capped, WebGL/reduced-motion fallback prop. |
| `portalIcons.ts` | Portal silhouettes + `iconSvg(id, fill)` to draw an icon inside your world (e.g. to foreshadow the next portal). |
| `portal.ts` | Portal maths (shared by film + lab). |
| `fonts.ts` | Every allowed display font as a CSS variable (see §4). |
| `palette.ts` | `RISO`, `RISO_RAMP`, `mix`, `overprint`, `alpha`, `ramp`. |
| `ease.ts` | `clamp, range, lerp, bell, smoothstep, easeInOutCubic, expoOut, backOut, hash…` |
| `WorldLab.tsx` + `app/life/lab/<id>/page.tsx` | Isolated dev harness per world (see §6). |

Global hooks: `[data-swipe-ignore]` (drag areas — stops the site's swipe-back navigation), `[data-site-cursor="hide"]` (hides the site cursor while hovering; render your own cursor inside the world), `.riso-grain` (shared animated grain overlay class).

## 3. The world contract (MUST)

Each world lives in `components/life/worlds/<id>/` and you may create any number of files there. **Do not edit anything outside your folder** (if you believe the foundation has a bug, say so in your report). Keep `index.tsx` and `meta.ts` shapes; you may change `meta.length` within 2.4–4.0 stage heights (outro: up to 6). Never change `id`, `icon`, order or `bg` without a strong reason (report it).

**`World.tsx`** (default export, `"use client"`), receives `{ progress }`:
1. Root: `<div className="absolute inset-0 overflow-hidden" …>` filling the stage. Paint `meta.bg` (or your own full-bleed background) — no transparent gaps.
2. **progress 0 = the title card.** An arresting, centred-enough composition that reads beautifully while it is only visible through the previous world's portal silhouette (centre ~40% of the stage). It must be a stable frame (ambient motion OK).
3. **progress 0 → 1 drives all choreography.** Use `useProgress(progress, p => …)`, framer `useTransform`, or a paused GSAP timeline + `tl.progress(p)`. NEVER: ScrollTrigger, scroll listeners, `position: fixed`/`sticky`, reading `window.scrollY`, Lenis directly.
4. **progress 1 = the exit frame.** Clean composition. Call `const origin = usePortalOrigin()` and put `ref={origin}` on the element the next portal is born from. Its box = the icon's 100×100 box at birth (give it the size you want the portal to start at; 0×0 = born from a point). Ideally your final beat foreshadows the next icon right there (draw it with `iconSvg(nextIcon)` or your own rendering) so the mask takes over seamlessly.
5. **Time-based loops only via `useTicker`** (auto-paused unless the world is on screen). Pointer only via `usePointer()` (only live for the active world; supports touch). No `setState` per frame — write to refs / MotionValues / DOM / canvas.
6. **Text is real DOM text** (headlines, facts, captions) so it's accessible and crisp. Canvases are decorative (`aria-hidden`).
7. **Fonts:** only `var(--f-…)` from `fonts.ts` plus the site's `var(--font-geist-sans)` / `var(--font-geist-mono)` (Tailwind `font-sans`/`font-mono`). Variable axes via `fontVariationSettings`.
8. **Colours:** only palette inks and derived shades (§1).
9. **Safe areas:** keep key text out of the top-centre band (top 96px, the site nav) and the bottom-right 300×76px (HUD).
10. **Mobile (390×844) is first-class:** reflow, bigger type ratios, fewer particles (`stage.lowPower`), tap instead of hover. Desktop 1440×900 must feel cinematic.
11. **Performance:** 60fps intent. Cap particles (desktop ≲ 2–3k sprites/instances; phone ≲ ¼ of that). Canvas 2D: size to `stage.width/height × min(devicePixelRatio, lowPower ? 1.25 : 2)`, re-init on resize. R3F: only via `<LazyCanvas>`, instanced meshes for repeats, dispose what you create manually. No unbounded allocations per frame.
12. **Drag/twist interactions:** wrap in `data-swipe-ignore`; never capture the wheel (scrolling must always advance the film). Touch drags must not block vertical page scroll except inside the explicit interactive object (use `touch-action` carefully).
13. **No new dependencies.** Available: `framer-motion`, `gsap` (+ its free plugins, e.g. SplitText, MorphSVG, CustomEase), `three`, `@react-three/fiber`, `@react-three/drei`, `matter-js`, `simplex-noise`, `lenis`.

**`Static.tsx`** (default export): the reduced-motion version. A readable, motionless composition (normal document flow, ~1–2 screens tall) containing **every fact and line** of the world, in the world's art direction. Only `useStage()` is available (no `useWorld`/`useTicker`/`usePointer`/`LazyCanvas`).

## 4. Fonts available (CSS variables)

`--f-anybody` (wdth 50–150, wght 100–900, ital) · `--f-anton` · `--f-archivo` (wdth 62–125, wght) · `--f-bagel` · `--f-big-shoulders` (opsz, wght) · `--f-caveat` · `--f-cinzel` · `--f-courier` (Courier Prime) · `--f-dm-mono` · `--f-doto` (ROND, wght) · `--f-fraunces` (SOFT, WONK, opsz, wght, ital) · `--f-plex-mono` · `--f-instrument` (Instrument Serif, ital) · `--f-jetbrains` · `--f-martian` (wdth, wght) · `--f-monoton` · `--f-nabla` (EDPT, EHLT; COLRv1 colour font) · `--f-marker` (Permanent Marker) · `--f-pixelify` · `--f-rubik-mono` · `--f-share-tech` · `--f-silkscreen` · `--f-space-mono` · `--f-tilt-warp` (XROT, YROT) · `--f-unbounded` (wght 200–900), plus Geist Sans/Mono.

(Fonts named in a concept but not listed — e.g. DotGothic16, Zen Kaku, Gochi Hand — are not available: substitute from this list.)

## 5. The worlds

Concept details live in `docs/superpowers/specs/2026-11-06-life-world-concepts.json` (array; find the entry whose `world` field starts with the prefix given below, then `concepts[i]`). Build the chosen concept faithfully — hero moment, supporting elements, scroll beats, copy — **with the overrides below, which win over the concept**. Global overrides apply to every world: Riso palette, smooth (no flash/inversion/strobe), the portal contract in §3, no opt-in mic/camera permissions, no external assets.

Portal chain (icon that opens INTO each world): bridge → `mic` → Anchoring → `skate` → Sports → `cube` → Rubik's → `eye` → Social → `gavel` → MUN → `house` → Moving → `island` → Minecraft → `receipt` → Startups → `bicep` → Fitness → `lamp` → JEE → `laptop` → Hackathons → `whorl` → Outro.

### 01 · Anchoring (age 11) — "Up To Eleven"
- Concept: `world` starts with `01 — Anchoring`, **concepts[1]**. Folder `anchoring`, bg paper, enters via `mic` (born from the full stop of "Here's the gist of it."), **exits via `skate`**.
- Facts: school anchor (stage host/emcee) in Grade 6 and Grade 7. Headline "MIC ON."
- Riso mapping: paper ground; the four "ink passes" are cobalt (whisper) → teal → sun → pink (clip/red). VU ladder cobalt→teal→sun→pink. The hand-scrawled "11 ← (me)" in pink, `--f-marker`. Knob in ink with paper markings.
- Overrides: **cut the opt-in "Open mic" (no microphone permission).** The fourth-wall frame buzz must stay inside the stage (you can't touch the site frame) — fake it with a 1–2px inner border jitter on your own root. The clip moment: no white flash; the halftone dots fuse and the rails slice the type.
- Exit: the knob / VU / "11" composition settles; register the origin where a small skate silhouette appears (e.g. the knob's centre turning into a wheel).

### 02 · Sports (age 14) — "Laps Become Medals"
- Concept: `#2 Sports`, **concepts[0]**. Folder `sports`, bg ink, enters via `skate`, **exits via `cube`** (the concept's own ending already squares the circle into the cube silhouette — keep it; register the origin on that drawn cube).
- Facts: roller skating — state level; yoga — state level; 20–25 medals combined; "I tried to go pro … Then life moved in another direction."
- Riso mapping: night rink = ink; lane lines cobalt @ ~35%; chequered start pink/sun; lap trails cycle pink → sun → teal → cobalt (additive on ink); counters in sun (`font-mono`); medal: iridescent metal lit by `<Lightformer>`s in pink/sun/teal/cobalt (no HDR); lotus reverse in teal/cobalt.
- Overrides: **no white strike frame and no 6px shake** — the strike is a press: scale-in + radial halftone ring + emissive→bump transition. Monoton only on the title card. Keep the 2D emboss fallback for no-WebGL/lowPower.

### 03 · Rubik's (age 14) — "Face Value"
- Concept: `#3 Rubik's`, **concepts[0]** ("Face Value"). Folder `rubiks`, bg paper, enters via `cube`, **exits via `eye`** (concept's "too deep" ending: the cube cracks open and you dive into its core — the eye portal is born from the core; register the origin there).
- Facts: 14 years old; 7+ cubes (different puzzle types); "way too much time"; habit of going too deep into things.
- Riso mapping: Swiss poster on paper with ink type; six sticker inks = paper, sun, pink, teal, cobalt, `overprint(pink, sun)`; cube body ink; LCD in ink/sun; lock shockwaves as halftone rings in the face colour.
- Must include: **grab-and-twist free play** after the solve ("Go on, scramble it. I'll wait.") — drag a face to turn a layer (mouse + touch), on a `data-swipe-ignore` area. Keep it robust on phones.

### 04 · Social (age 15) — "Eyes On Me"
- Concept: `#4 SOCIAL`, **concepts[1]**. Folder `social`, bg pink, enters via `eye`, **exits via `gavel`** (followers swarm into the gavel outline at the exit point; register origin there).
- Facts: Instagram content creation; 10M+ views; 2K+ followers; "Before I knew what a startup was, I was already trying to get strangers on the internet to pay attention."
- Riso mapping: bubblegum field = pink; outlines ink; sclera paper; irises cobalt (some teal); blush `alpha(ink, .12)`; the 2K+ follower eyes = **sun** irises (concept says lime); punchlines Bagel Fat One paper with hard ink offset.
- Overrides: keep it cartoon and warm (never realistic or trypophobic): cap cells (desktop ≤ 30k, phone ≤ 6k), loose jittered spacing; densest stare < 1 viewport of scroll. No logo/UI of any real platform.

### 05 · MUN (age 15) — "Turning the Room"
- Concept: `#5 MUN`, **concepts[1]** ("Turning the Room"). Folder `mun`, bg cobalt, enters via `gavel`, **exits via `house`** (threads stitch the house outline as string art; register origin on it).
- **Graft from concepts[0] ("Spin Room"):** open with Josh's typed, half-redacted position paper (Courier Prime, typewriter on scroll, COMMITTEE/COUNTRY/TOPIC slammed black) before the hall; and the red rubber-stamp seal "2ND BEST DELEGATE · MODEL UNITED NATIONS ·" (pink ink) plus the overlapping "MULTIPLE CONFERENCES" stamp burst. Do NOT build Spin Room's 3D anamorphic bar trick (that idea belongs to Minecraft).
- Facts: Model United Nations; 2nd Best Delegate; multiple conferences; "Learned to argue before I learned to code."; found a way to win arguments even when the initial position was weak.
- Riso mapping: hall = cobalt; threads paper/sun/teal at low alpha with `lighter`; opponent podium pink; Josh's placard sun; starburst paper→sun. Fraunces (weight scrubbed 100→900), Archivo for placards, Martian Mono labels.
- Overrides: Canvas 2D only (no three.js). No real country names/flags.

### 06 · Moving homes (age 15) — "Repotted"
- Concept: `#6 MOVING`, **concepts[1]**. Folder `moving`, bg ink, enters via `house`, **exits via `island`** (concept's soil-pixelates-into-cubes exit: let the cubes assemble a small floating voxel island silhouette and register the origin on it).
- Facts: 5 homes in 3 years; "Some years weren't about winning anything. Some years were just about adjusting."
- Riso mapping: dark ground ink with soft vignette; five glazed house-shaped pots: pink (01), sun (02), cobalt (03), teal (04), paper (05); sprout teal with sun light; soil `overprint(sun, ink)` tones; roots paper @ alpha; Fraunces (SOFT/WONK axes) paper; plant tag paper with DM Mono + Caveat.
- This is the quiet world: slower, more air, warm. Precompute root growth (fixed seed); no heavy runtime sims.

### 07 · Minecraft (age 16) — "From My Angle"
- Concept: `#7 Minecraft`, **concepts[0]**. Folder `minecraft`, bg pink (sunset), enters via `island`, **exits via `receipt`** (e.g. the debris settles into a receipt-shaped voxel slab / the last word's blocks fold into the receipt silhouette; register origin there).
- Facts: obsessed with Minecraft; almost went competitive; Bedwars, Skywars, montages; ~400 YouTube subscribers.
- Riso mapping: sky gradient cobalt (top) → pink → sun (horizon); grass teal; dirt `overprint(sun, ink)`/`mix`; stone `mix(ink, paper, .45)`; per-lock re-grade among inks; Nabla "16" with `@font-palette-values` overriding to Riso inks; Silkscreen/Pixelify for UI.
- Overrides (copyright): **original** chunky voxel style only — no Minecraft textures, logo, font, UI chrome, item art or sounds. The word "Minecraft" may appear only as plain text. "ALMOST WENT COMPETITIVE." never fully locks (keep that joke).

### 08 · Startups (age 17) — "The Receipts"
- Concept: `#8 Startups`, **concepts[1]**. Folder `startups`, bg ink, enters via `receipt`, **exits via `bicep`** (after the receipt tears off and flies at the camera, a small bicep stamp/sticker is left on the slot or the final sticker the price gun fires is the bicep; register origin there).
- Facts (exact): **StarScale** (2025) — high-end animated websites, ₹70k across 3 clients, shipped. **Frags n Flavs** (Jan–Mar 2026) — premium instant gifting, ₹42k in 3 months, live + sold IRL. **LazyBull** (2026) — AI-simplified trading, built in 2 days, for sale. Headline "Then I started building." (3 startups).
- Riso mapping: ink room; printer slot ink with a sun glow; receipt paper with ink print (Doto ROND + Space Mono); stamps: SHIPPED cobalt, LIVE + SOLD IRL teal, FOR SALE pink; gift ribbon pink; price-gun stickers sun; background overprint words in pink/cobalt at low alpha.
- Overrides: replace the concept's halftone-shockwave *shader* with CSS/SVG/Canvas 2D halftone rings (no WebGL in this world). The price-gun cursor is desktop-only; on touch, taps slap stickers.

### 09 · Fitness (age 18) — "Heat Signature"
- Concept: `#9 Fitness`, **concepts[1]**. Folder `fitness`, bg ink, enters via `bicep`, **exits via `lamp`** (the last heat that lingers takes the lamp silhouette, or a cooling lamp-shaped afterimage; register origin there).
- Facts: built the body too — discipline, training, nutrition, consistency.
- Riso mapping: **thermal ramp = `RISO_RAMP`** (ink → cobalt → teal → pink → sun → paper white-hot); background cold ink/cobalt; HUD text `--f-share-tech` paper; the mode-switch easter egg cycles between ramps built only from Riso inks.
- Implementation: a WebGL2 full-screen shader (raw WebGL or a single orthographic `<LazyCanvas>` plane) is fine; must have a lowPower path (quarter-res buffer, fewer SDFs) and a no-WebGL fallback (2D canvas or SVG heat silhouette). Real DOM copy of the four words.

### 10 · JEE (age 18) — "Projections"
- Concept: `#10 JEE`, **concepts[1]**. Folder `jee`, bg paper, enters via `lamp`, **exits via `laptop`**: lamp position B's shadow is the **laptop silhouette** (use `PORTAL_ICONS.laptop` path as the mask for the carve) — register the origin on that shadow's icon box so the portal is literally born from the shadow.
- Facts: ~2 years of JEE preparation; IIT didn't happen; "This one didn't work."; "Some plans end. The person doesn't."
- Riso mapping: room walls paper lit warm (sun-tinted light), shadows ink, books in all inks, lights-out = pure ink, window skies cobalt/pink/sun; Fraunces paper lines; Geist Mono labels.
- Overrides: honest and restrained — this is the tonal low point; keep motion calm. The lights-out is a fade/flicker of ≤ 2 frames (no strobe). Provide a lowPower/no-WebGL fallback (pre-composed SVG shadows).

### 11 · Hackathons (age 18) — "Hot Reload"
- Concept: `#11 HACKATHONS`, **concepts[1]**. Folder `hackathons`, bg `#FFFFFF` (cold open), enters via `laptop`, **exits via `whorl`** (after REPEAT/git-reset, the final frame shows a thumbprint-like whorl — e.g. the reset spinner or the "commit" stamp as a fingerprint; register origin there).
- Facts: IIT Roorkee Productathon — ~4th; Ashoka University Fashion Design Hackathon — 2nd; Smart India Hackathon — participated; "BUILD. BREAK. PITCH. REPEAT."
- Riso mapping: cold open = browser-default white, serif, `#0000EE` links (the joke; the only off-palette moment); once the CSS "installs": paper ground, ink text, sun/cobalt/pink/teal blocks; debug outlines cycle inks by depth; error sheet pink with paper text; terminal ink with sun text. Anybody + JetBrains Mono.
- Overrides: physics heap may use `matter-js` (lazy-import it inside the world) or a small custom solver; must be deterministic and fully reversible when scrolling back (scroll position ⇒ state).

### ∞ · Outro — "Whorl of Worlds"
- Concept: `12 · OUTRO`, **concepts[0]**. Folder `outro`, bg ink, enters via `whorl`, **no exit** (last world; progress 1 must be a satisfying, stable end frame with the "Back to home" thumbprint CTA → `next/link` to `/`).
- Must contain ALL copy: "So what's the pattern?" · "I keep trying things." · domains: Sports, Content, Gaming, Speaking, Academics, Building, Business, Design, Technology · "I don't think I'm good at just one thing yet." · "Maybe that's the point." · values — CURIOSITY (I like learning how different worlds work.), OBSESSION (When something grabs me, I go deep.), EXPERIMENTATION (I'd rather try than wonder.), ADAPTABILITY (I've had to restart more than once.), BUILDING (Eventually, I stopped only consuming and started making.) · 2026 CURRENTLY: CS + AI/ML, College, Startups, Building, Learning, Training · NEXT: Build something people actually use; Become technically dangerous; Build companies; Get better at everything that matters; Create work I'm proud of · "The story isn't done." · Back to home.
- Riso mapping: ink ground; ridges banded with each world's accent (from the registry metas: anchoring pink, sports sun, rubiks cobalt, social pink, mun sun, moving teal, minecraft teal, startups pink, fitness sun, jee cobalt, hackathons sun — vary with paper/overprints so neighbours differ); the live outer ridge = sun (concept said lime); Big Shoulders (`--f-big-shoulders`) for display; Instrument Serif italic for human lines; Geist Mono HUD.
- Overrides: replace the current placeholder entirely (it's a spinning pink box smoke test). The section is long (meta.length 5–6): pace the copy so nothing is rushed; values and NEXT must be readable for a comfortable stretch of scroll.

## 6. How to verify your world (required before you finish)

- Dev server is already running at **http://localhost:3000** (hot reload). Don't start another one, don't run `next build`.
- Your isolated lab: **`http://localhost:3000/life/lab/<id>`** — `?p=0.42` freezes progress, `?dive=0.5` previews your exit portal (into a stand-in for the next world), `?reduced=1` renders `Static`. No params = slider/arrow keys.
- Screenshots (parallel-safe): `node /private/tmp/claude-502/-Users-josh-Desktop-CVJOB-shipwithjosh/b41af60a-e854-489a-a190-7d0a2f01dcaa/scratchpad/shot-tool/shot.mjs "<url>" <out.png> [width] [height] [waitMs]` → prints `{ok, errors}` (page errors/console errors). Save shots under `/private/tmp/claude-502/-Users-josh-Desktop-CVJOB-shipwithjosh/b41af60a-e854-489a-a190-7d0a2f01dcaa/scratchpad/shots/<id>/`. Open PNGs with the Read tool to look at them. WebGL works headless (SwiftShader — slow but correct).
- Minimum shot set: desktop 1440×900 at p = 0, .15, .3, .45, .6, .75, .9, 1 and dive=.4; phone 390×844 at p = 0, .3, .6, 1; `?reduced=1` at desktop. Fix anything ugly, broken, clipped, unreadable or off-palette. Iterate until it would impress an Awwwards jury.
- Typecheck: `npx tsc --noEmit -p . 2>&1 | grep "components/life/worlds/<id>/"` must print nothing. (Other worlds are being built in parallel — ignore errors outside your folder.)
- Report errors from the shot tool's `errors` array as fixed or explained.
