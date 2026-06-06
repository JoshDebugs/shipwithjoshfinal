import { Hero } from "@/components/Hero";
import { Work } from "@/components/Work";
import { Principles } from "@/components/Principles";
import { Stack } from "@/components/Stack";
import { Lab } from "@/components/Lab";
import { Contact } from "@/components/Contact";

/*
 * Sections render directly into <main>. The previous `SectionBox` wrapper
 * (rounded-2xl + border-fg + bg-bg) duplicated the outer app frame's border
 * one-for-one — fine when the body was the scroll surface, redundant now
 * that the frame is permanent.
 *
 * Spacing is preserved: `space-y-3 md:space-y-4` on <main> still applies
 * between direct children, and each section keeps its own bg + internal
 * overflow handling, so removing the wrapper doesn't shift layout.
 */

export default function Page() {
  return (
    <main className="relative space-y-3 p-3 md:space-y-4 md:p-4">
      <Hero />
      <Work />
      <Principles />
      <Stack />
      <Lab />
      <Contact />
    </main>
  );
}
