import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/lib/projects";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CaseStudyBody } from "@/components/CaseStudyBody";

/**
 * Standalone case-study route.
 *
 * Reached by direct URL, refresh on `/work/[slug]`, or share links. When
 * navigated to from the home page (`/`), the @modal parallel-route slot
 * intercepts and renders ProjectModal instead — see
 * `app/@modal/(.)work/[slug]/page.tsx`.
 *
 * Body content is shared with the modal via `<CaseStudyBody>` so a single
 * edit to the case study shows up in both surfaces.
 */

type RouteParams = { slug: string };

export function generateStaticParams(): RouteParams[] {
  return projects.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.id === slug);
  if (!project) return { title: "case not found" };
  return {
    title: `${project.name}. case study`,
    description: project.tagline + " " + project.description,
    openGraph: {
      title: `${project.name}. case study · shipwithjosh.com`,
      description: project.tagline,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name}. case study`,
      description: project.tagline,
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.id === slug);
  if (!project) notFound();

  return (
    <main className="relative bg-bg">
      {/* Top chrome */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 pt-6 md:pt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-soft">
        <Link
          href="/"
          className="hover:text-accent transition-colors"
          data-cursor="hover"
        >
          shipwithjosh<span className="text-accent">.</span>com
        </Link>
        <Link
          href="/#work"
          className="group flex items-center gap-2 hover:text-accent transition-colors"
          data-cursor="hover"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="transition-transform duration-500 group-hover:-translate-x-1"
          >
            <path
              d="M10 6H2M2 6L6 2M2 6L6 10"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="square"
            />
          </svg>
          back to work
        </Link>
        <div className="tabular text-muted hidden md:block">
          {project.index} ── of ── 03
        </div>
      </header>

      <ScrollReveal>
        <CaseStudyBody project={project} />
      </ScrollReveal>

      {/* Footer */}
      <footer className="border-t border-line px-6 md:px-12 py-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          <div className="flex items-center gap-4">
            <span>© 2026 joshmann singh</span>
            <span className="hidden md:inline text-line">/</span>
            <span className="hidden md:inline">shipwithjosh.com</span>
          </div>
          <Link
            href="/"
            className="text-fg-soft hover:text-accent transition-colors"
            data-cursor="hover"
          >
            ← back home
          </Link>
        </div>
      </footer>
    </main>
  );
}
