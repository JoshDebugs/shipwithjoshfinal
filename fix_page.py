content = """import { Metadata } from "next";
import { LifeHero } from "@/components/life/LifeHero";
import { ChapterSports } from "@/components/life/ChapterSports";
import { ChapterSocial } from "@/components/life/ChapterSocial";
import { ChapterMinecraft } from "@/components/life/ChapterMinecraft";
import { ChapterRubiks } from "@/components/life/ChapterRubiks";
import { ChapterMUN } from "@/components/life/ChapterMUN";
import { ChapterAnchoring } from "@/components/life/ChapterAnchoring";
import { ChapterMoving } from "@/components/life/ChapterMoving";
import { ChapterStartups } from "@/components/life/ChapterStartups";
import { ChapterFitness } from "@/components/life/ChapterFitness";
import { ChapterJEE } from "@/components/life/ChapterJEE";
import { ChapterHackathons } from "@/components/life/ChapterHackathons";
import { PatternTransition } from "@/components/life/PatternTransition";
import { CoreValues } from "@/components/life/CoreValues";
import { CurrentChapter } from "@/components/life/CurrentChapter";
import { FutureChapter } from "@/components/life/FutureChapter";
import { LifeNav } from "@/components/life/LifeNav";
import { LifeTimeline } from "@/components/life/LifeTimeline";
import { HorizontalScrollGroup } from "@/components/life/HorizontalScrollGroup";

export const metadata: Metadata = {
  title: "Josh / Life",
  description: "Not a résumé. Just the receipts.",
};

export default function LifePage() {
  return (
    <main className="relative w-full bg-bg text-fg min-h-screen">
      <LifeNav />
      <LifeTimeline />
      <LifeHero />
      
      <div className="relative w-full flex flex-col items-center">
        <HorizontalScrollGroup numPanels={3}>
          <ChapterSports />
          <ChapterSocial />
          <ChapterMinecraft />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={3}>
          <ChapterRubiks />
          <ChapterMUN />
          <ChapterAnchoring />
        </HorizontalScrollGroup>

        <HorizontalScrollGroup numPanels={5}>
          <ChapterMoving />
          <ChapterStartups />
          <ChapterFitness />
          <ChapterJEE />
          <ChapterHackathons />
        </HorizontalScrollGroup>
      </div>

      <PatternTransition />
      <CoreValues />
      <CurrentChapter />
      <FutureChapter />
    </main>
  );
}
"""
with open('app/life/page.tsx', 'w') as f:
    f.write(content)
