import { notFound } from "next/navigation";
import { WorldLab } from "@/components/life/multiverse/WorldLab";

/**
 * Dev-only: render a single world at a fixed or scrubbed progress.
 *   /life/lab?world=sports            → slider to scrub progress
 *   /life/lab?world=sports&p=0.42     → frozen at 42% (for screenshots)
 *   /life/lab?world=sports&dive=0.5   → halfway through the portal into the next world
 */
export default function LifeLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <WorldLab />;
}
