export type ProjectStatus = "for-sale" | "live" | "shipped";

export type CaseStudy = {
  problem: string;
  approach: string;
  whatIBuilt: string[];
  outcome: string;
  outcomeStat?: { value: string; label: string };
  screenshots?: { src: string; alt: string; caption?: string }[];
  subProjects?: {
    name: string;
    tagline: string;
    description: string;
    image?: string;
  }[];
  cta?: { label: string; href: string; note?: string };
  learnings?: string[];
};

export type Project = {
  id: string;
  index: string;
  name: string;
  tagline: string;
  status: ProjectStatus;
  statusLabel: string;
  year: string;
  metrics: { value: string; label: string }[];
  description: string;
  bullets: string[];
  stack: string[];
  role: string;
  previewImage: string;
  hero: { src: string; alt: string; aspect: string };
  gallery: { src: string; alt: string }[];
  links?: { label: string; href: string }[];
  caseStudy: CaseStudy;
};

export const projects: Project[] = [
  {
    id: "lazybull",
    index: "01",
    name: "LazyBull",
    tagline: "AI-simplified trading. Built in 2 days.",
    status: "for-sale",
    statusLabel: "for sale",
    year: "2026",
    metrics: [
      { value: "2", label: "days to build" },
      { value: "AI", label: "native layer" },
      { value: "live", label: "quant models" },
    ],
    description:
      "An AI layer that lives on top of the charts. It watches your trades, flags what's broken, and generates bets with a confidence score. Plus learning modules and live quant models embedded on-page.",
    bullets: [
      "Designed an AI overlay that interacts with trade charts in real time.",
      "Built confidence-scored bet generation for new traders.",
      "Embedded learning modules so users level up while they trade.",
      "Wired live quant models directly into the page.",
    ],
    stack: ["Next.js", "AI agents", "Charts", "Real-time"],
    role: "Co-founder · full-stack · design",
    previewImage: "/assets/Lazybull1.png",
    hero: {
      src: "/assets/Lazybull1.png",
      alt: "LazyBull dashboard with AI overlay",
      aspect: "16 / 10",
    },
    gallery: [
      { src: "/assets/Lazybull2.png", alt: "LazyBull AI analysis panel" },
      { src: "/assets/LazyBull3.png", alt: "LazyBull learning module" },
      { src: "/assets/LazyBull4.png", alt: "LazyBull quant model view" },
    ],
    caseStudy: {
      problem:
        "Retail traders drown in information. Charts are noise until someone interprets them. New traders learn by losing money. they don't know what they don't know, and existing tools assume the opposite. The gap between 'looking at a chart' and 'understanding what it's telling you' is where most retail capital quietly dies.",
      approach:
        "Put AI literally on the chart. Not in a side panel, not as a chatbot. embedded as an overlay that watches the same thing the trader watches, and explains it in real-time. Confidence scores instead of certainty. Learning modules that surface contextually, not in a separate 'academy' tab. Quant models accessible on the same page, not behind a paywall and three menus.",
      whatIBuilt: [
        "AI overlay that interacts with chart elements (candles, indicators, drawn levels) in real time.",
        "Confidence-scored bet generator. every suggestion ships with a 0–100 confidence number, no fake certainty.",
        "Inline learning modules. short lessons that appear contextually, so users level up while trading instead of beforehand.",
        "Live quant models embedded on the page. strategies you can watch run, not just read about.",
        "End-to-end built in 2 days. Next.js + AI SDK + chart library. Shipped, not prototyped.",
      ],
      outcome:
        "v1 shipped in 2 days. Currently for sale. The thesis. AI as the interpretation layer between traders and markets. survived contact with reality.",
      outcomeStat: { value: "for sale", label: "asset, not project" },
      cta: {
        label: "want to buy LazyBull?",
        href: "mailto:workaddressjosh@gmail.com?subject=LazyBull%20%E2%80%94%20interested%20in%20buying",
        note: "serious offers only. ai-native trading product. fully built.",
      },
    },
  },
  {
    id: "frags-n-flavs",
    index: "02",
    name: "Frags n Flavs",
    tagline: "Premium instant gifting. ₹42k in 3 months.",
    status: "live",
    statusLabel: "live + sold IRL",
    year: "Jan–Mar 2026",
    metrics: [
      { value: "₹42K", label: "revenue" },
      { value: "2", label: "Gurgaon stalls" },
      { value: "6", label: "weeks to live" },
    ],
    description:
      "Premium gifting, instant. Customizable boxes for personal and corporate use. I took it from ideation to live storefront, then put up two physical stalls in Gurgaon and ran ops.",
    bullets: [
      "Ideation → product → live storefront in ~6 weeks.",
      "Stalls at a Gurgaon residential block and Cyberscape tower.",
      "₹32k revenue from stalls + ₹10k online = ₹42k total.",
      "Designed the box configurator and the checkout flow end to end.",
    ],
    stack: ["Custom storefront", "Box configurator", "IRL ops", "Corporate gifting"],
    role: "Co-founder · product + build + ops",
    previewImage: "/assets/fragsnflavswebsite.png",
    hero: {
      src: "/assets/fragsnflavswebsite.png",
      alt: "Frags n Flavs storefront",
      aspect: "16 / 10",
    },
    gallery: [
      { src: "/assets/FRAGSNFLAVS.png", alt: "Frags n Flavs box" },
      { src: "/assets/fragsnflavs1.png", alt: "Frags n Flavs product" },
    ],
    caseStudy: {
      problem:
        "Gifting in India is bimodal: either generic (Amazon vouchers, branded baskets you've seen a hundred times) or slow (custom artisan, 2-3 weeks of lead time). The middle. premium AND instant AND customizable. didn't exist. Corporates have the same problem at 10x scale: they need branded gift drops in days, not weeks.",
      approach:
        "Pre-curated boxes with on-the-fly customization. Build the storefront for online demand, but don't wait for SEO to compound. put physical stalls in high-traffic locations (residential blocks + tech parks) for instant trust + cash. Ops, build, and design all on one operator.",
      whatIBuilt: [
        "Custom storefront with a box configurator. pick the box, pick the contents, see the price update live.",
        "Checkout flow optimized for impulse (gifting is emotional, not analytical).",
        "Two physical stalls. one residential, one corporate tower (Cyberscape, Gurgaon).",
        "Ops: inventory, delivery, customer comms. all run solo for the first 6 weeks.",
        "Brand identity from scratch: name, logo, box design, voice.",
      ],
      outcome:
        "₹42k revenue in ~6 weeks (₹32k stalls + ₹10k online). More importantly: validated that the premium-instant-customizable gap exists and converts. Corporate bulk inquiries started landing in week 4.",
      outcomeStat: { value: "₹42k", label: "in 6 weeks, solo" },
    },
  },
  {
    id: "starscale",
    index: "03",
    name: "StarScale",
    tagline: "High-end animated sites. ₹70k across 3 clients.",
    status: "shipped",
    statusLabel: "shipped",
    year: "2025",
    metrics: [
      { value: "₹70K", label: "combined revenue" },
      { value: "3", label: "clients shipped" },
      { value: "100%", label: "animation-led" },
    ],
    description:
      "Freelance gig building high-end animated websites. Three clients. Each wanted motion as the medium, not decoration. booking flows, gamified product reveals, live location tracking.",
    bullets: [
      "Hotel + rooftop restaurant. booking flow with live property preview animations.",
      "Gamified gym. interactive product showcase for connected machines.",
      "Roaming ice cream truck. live location tracking with a rotating flavor menu.",
    ],
    stack: ["Animation-first web", "GSAP", "WebGL where needed", "Booking + maps"],
    role: "Freelance dev · motion + interaction",
    previewImage: "",
    hero: {
      src: "",
      alt: "StarScale projects",
      aspect: "16 / 10",
    },
    gallery: [],
    caseStudy: {
      problem:
        "Businesses with genuinely interesting products. boutique hotels, gamified fitness equipment, roaming food vendors. get stuck with generic web templates that flatten what makes them distinctive. The motion-first agencies that could do it justice cost too much for early-stage. The gap: high-craft animation work at solo-operator pricing.",
      approach:
        "Treat motion as the medium, not the decoration. Each site is built around the client's single most distinctive feature. and that feature gets the animation budget. Everything else stays restrained so the signature moment lands.",
      whatIBuilt: [
        "Three production sites shipped across three different verticals.",
        "Each built to highlight one signature interaction the client cared most about.",
        "Combined revenue of ₹70k. Solo. While in college.",
      ],
      outcome:
        "₹70k combined revenue across three shipped sites. More importantly: three clients who got exactly the vision they pitched, not a template. Two referred follow-up work.",
      outcomeStat: { value: "3 / 3", label: "shipped to vision" },
      subProjects: [
        {
          name: "Hotel + rooftop restaurant",
          tagline: "Booking with live property preview.",
          description:
            "Boutique hotel with a rooftop restaurant. The owners wanted potential guests to feel the property before booking. so the site is built around a scroll-driven preview that walks you through the space as you read the rates. Booking flow integrated without breaking the cinematic feel.",
        },
        {
          name: "Gamified gym",
          tagline: "Interactive showcase for connected machines.",
          description:
            "Gym with smart, connected workout machines. The site shows the machines the way a video game shows weapons. each one has its own page with interactive previews, stats, and game-like feedback. Translates the in-person experience into a web vocabulary.",
        },
        {
          name: "Roaming ice cream truck",
          tagline: "Live location tracking + rotating menu.",
          description:
            "Mobile vendor that moves daily. The site shows where the truck is right now (live map), what flavors are loaded today (rotating menu), and lets customers signal interest from where they're standing. Built so the truck doesn't have to post on Instagram every morning.",
        },
      ],
    },
  },
];

