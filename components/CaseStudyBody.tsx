import Image from "next/image";
import Link from "next/link";
import { projects, type Project } from "@/lib/projects";

/**
 * The shared case-study body used by both the modal overlay
 * (`app/@modal/(.)work/[slug]/page.tsx`) and the standalone route
 * (`app/work/[slug]/page.tsx`).
 *
 * The chrome around it differs:
 *   - modal: slide-up panel, close button, no next-project chain
 *   - page : full route, header, footer, next-project chain
 *
 * But the actual case-study content — problem, approach, what i built,
 * gallery, stack, outcome, learnings, links, cta — is identical, so it
 * lives here. Anything you want to add to a project's story lands here
 * once and shows up in both surfaces.
 *
 * Elements with className="reveal" are intentional: ScrollReveal observes
 * them and fades them up on enter. The modal wires its own ScrollReveal
 * pointed at the modal's scroll container; the page wraps the body in the
 * default-root ScrollReveal.
 */

const statusDot: Record<Project["status"], string> = {
  "for-sale": "bg-accent",
  live: "bg-fg",
  shipped: "bg-muted",
};

const statusText: Record<Project["status"], string> = {
  "for-sale": "text-accent",
  live: "text-fg",
  shipped: "text-muted",
};

export function CaseStudyBody({
  project,
  // The page version chains to the next project at the bottom; the modal
  // version omits that (clicking another row from inside the modal would be
  // odd). Pass `showNext={false}` to suppress.
  showNext = true,
}: {
  project: Project;
  showNext?: boolean;
}) {
  const cs = project.caseStudy;
  const idx = projects.findIndex((p) => p.id === project.id);
  const next = projects[(idx + 1) % projects.length];

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 md:px-12 pt-16 md:pt-28 pb-12 md:pb-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted reveal">
          // the long version of case {project.index}
        </div>

        <h1 className="mt-8 text-[clamp(2.75rem,11vw,9.5rem)] font-medium leading-[0.95] tracking-[-0.045em] reveal">
          {project.name}
          <span className="text-accent">.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg md:text-2xl text-fg-soft leading-relaxed reveal">
          {project.tagline}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-2 md:gap-3 reveal">
          <span
            className={`inline-flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] ${statusText[project.status]}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status]} ${
                project.status === "for-sale" ? "animate-pulse" : ""
              }`}
            />
            {project.statusLabel}
          </span>
          <span className="inline-flex items-center rounded-full border border-line bg-bg-soft px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-soft tabular">
            {project.year}
          </span>
          <span className="inline-flex items-center rounded-full border border-line bg-bg-soft px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-soft">
            {project.role.split("·")[0].trim()}
          </span>
        </div>
      </section>

      {/* Hero image */}
      {project.hero.src && (
        <section className="px-6 md:px-12 pb-12 md:pb-20">
          <div
            className="relative w-full overflow-hidden rounded-lg border border-line bg-bg-soft reveal"
            style={{ aspectRatio: project.hero.aspect }}
          >
            <Image
              src={project.hero.src}
              alt={project.hero.alt}
              fill
              priority
              sizes="(min-width: 768px) 88vw, 100vw"
              className="object-cover"
            />
          </div>
        </section>
      )}

      {/* Quick stats */}
      <section className="px-6 md:px-12 pb-16 md:pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 reveal">
          {[
            { label: "role", value: project.role.split("·")[0].trim() },
            { label: "timeline", value: project.year },
            { label: "status", value: project.statusLabel },
            {
              label: "headline metric",
              value: project.metrics[0]?.value ?? "—",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-md border border-line bg-bg-soft/40 px-4 py-4"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                {m.label}
              </div>
              <div className="mt-2 text-base md:text-lg text-fg">
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Section eyebrow="// problem">
        <p className="text-lg md:text-xl text-fg leading-relaxed max-w-3xl">
          {cs.problem}
        </p>
      </Section>

      <Section eyebrow="// approach">
        <p className="text-lg md:text-xl text-fg leading-relaxed max-w-3xl">
          {cs.approach}
        </p>
      </Section>

      <Section eyebrow="// what i built">
        <ul className="space-y-3 max-w-3xl">
          {cs.whatIBuilt.map((item) => (
            <li
              key={item}
              className="flex gap-4 text-base md:text-lg text-fg-soft leading-relaxed"
            >
              <span className="mt-3 h-px w-4 flex-none bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {project.gallery.length > 0 && (
          <div
            className={`mt-12 grid gap-3 reveal ${
              project.gallery.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-3"
            }`}
          >
            {project.gallery.map((g) => (
              <div
                key={g.src}
                className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-bg-soft"
              >
                <Image
                  src={g.src}
                  alt={g.alt}
                  fill
                  sizes="(min-width: 768px) 30vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {cs.subProjects && (
          <div className="mt-12 space-y-4">
            {cs.subProjects.map((sp, i) => (
              <div
                key={sp.name}
                className="rounded-lg border border-line bg-bg-soft/40 p-5 md:p-8 reveal"
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs tracking-[0.2em] text-muted tabular mt-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl md:text-2xl font-medium text-fg tracking-[-0.02em]">
                      {sp.name}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                      {sp.tagline}
                    </p>
                    <p className="mt-4 text-base text-fg-soft leading-relaxed max-w-3xl">
                      {sp.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section eyebrow="// stack">
        <div className="flex flex-wrap gap-2">
          {project.stack.map((s) => (
            <span
              key={s}
              className="inline-flex items-center rounded-full border border-line bg-bg-soft px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-fg-soft"
            >
              {s}
            </span>
          ))}
        </div>
      </Section>

      {/*
       * Lessons — renders only if `caseStudy.learnings` is populated.
       * Schema-supported in `lib/projects.ts` but currently empty across
       * all projects. Add real entries when you have them.
       */}
      {cs.learnings && cs.learnings.length > 0 && (
        <Section eyebrow="// what i learned">
          <ul className="space-y-3 max-w-3xl">
            {cs.learnings.map((item) => (
              <li
                key={item}
                className="flex gap-4 text-base md:text-lg text-fg-soft leading-relaxed"
              >
                <span className="mt-3 h-px w-4 flex-none bg-fg-soft" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/*
       * Links — live demo, repo, etc. Renders only if `project.links` is
       * populated. Same as above: schema-supported, currently empty. Drop
       * real URLs in `lib/projects.ts` per project when ready.
       */}
      {project.links && project.links.length > 0 && (
        <Section eyebrow="// links">
          <div className="flex flex-wrap gap-2">
            {project.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-soft transition-colors hover:border-accent/60 hover:text-accent"
                data-cursor="hover"
              >
                <span>{l.label}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  <path
                    d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="square"
                  />
                </svg>
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* Outcome */}
      <section className="relative px-6 md:px-12 py-16 md:py-24 overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-30" aria-hidden />
        <div className="relative">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted reveal">
            // outcome
          </div>

          {cs.outcomeStat && (
            <div className="mt-8 flex items-baseline gap-3 text-[clamp(3rem,12vw,9rem)] font-medium leading-[0.95] tracking-[-0.04em] reveal">
              <span className="text-fg">{cs.outcomeStat.value}</span>
              <span className="text-accent text-[0.35em] leading-none">
                / {cs.outcomeStat.label}
              </span>
            </div>
          )}

          <p className="mt-8 max-w-3xl text-lg md:text-xl text-fg-soft leading-relaxed reveal">
            {cs.outcome}
          </p>

          {cs.cta && (
            <a
              href={cs.cta.href}
              className="group mt-10 inline-flex items-center gap-3 rounded-full border border-accent bg-accent/10 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-accent transition-colors duration-300 hover:bg-accent hover:text-bg reveal"
              data-cursor="hover"
            >
              <span>{cs.cta.label}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
              >
                <path
                  d="M3 11L11 3M11 3H5M11 3V9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="square"
                />
              </svg>
            </a>
          )}
          {cs.cta?.note && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted reveal">
              {cs.cta.note}
            </p>
          )}
        </div>
      </section>

      {/* Next chapter — page-only by default. Modal usage suppresses this
       *  because chaining from inside an overlay is jarring (the modal would
       *  swap content under the user, and the URL would change without the
       *  user moving). */}
      {showNext && (
        <section className="border-t border-line px-6 md:px-12 py-16 md:py-24">
          <Link
            href={`/work/${next.id}`}
            className="group block reveal"
            data-cursor="hover"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-4">
              next chapter
            </div>
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <div className="text-3xl md:text-6xl font-medium tracking-[-0.03em] leading-none text-fg group-hover:text-accent transition-colors duration-500">
                  {next.name}
                </div>
                <div className="mt-2 text-sm md:text-base text-fg-soft">
                  {next.tagline}
                </div>
              </div>
              <div className="text-fg-soft group-hover:text-accent transition-colors duration-500">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  className="transition-transform duration-500 group-hover:translate-x-2"
                >
                  <path
                    d="M6 16H26M26 16L18 8M26 16L18 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
              </div>
            </div>
          </Link>
        </section>
      )}
    </>
  );
}

function Section({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-6 md:px-12 py-12 md:py-20 border-t border-line">
      <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted mb-8 md:mb-10 reveal">
        {eyebrow}
      </div>
      <div className="reveal">{children}</div>
    </section>
  );
}
