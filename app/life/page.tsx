import { Metadata } from "next";
import { LifeHero } from "@/components/life/LifeHero";
import { Multiverse } from "@/components/life/multiverse/Multiverse";

export const metadata: Metadata = {
  title: "Josh / Life",
  description: "Not a résumé. Just the receipts.",
};

export default function LifePage() {
  return (
    <main className="relative w-full bg-bg text-fg min-h-screen">
      <LifeHero />
      <Multiverse />
    </main>
  );
}
