import { notFound } from "next/navigation";
import { projects } from "@/lib/projects";
import { ProjectModal } from "@/components/ProjectModal";

/**
 * Intercepting route — `(.)work/[slug]` means: from the same level (i.e. `/`),
 * navigation to `/work/[slug]` is intercepted and rendered HERE in the
 * @modal parallel slot, instead of unmounting the home page.
 *
 * Direct hits / refresh on `/work/[slug]` skip the interceptor and render
 * the standalone case-study page at `app/work/[slug]/page.tsx` (good for
 * SEO, OG cards, and sharing — the modal experience and the dedicated
 * route coexist with the same content via `<CaseStudyBody>`).
 */

type RouteParams = { slug: string };

export default async function InterceptedCasePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.id === slug);
  if (!project) notFound();

  return <ProjectModal project={project} />;
}
