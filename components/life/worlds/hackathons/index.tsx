// 11 · Hackathons, "Hot Reload". World and Static are code-split, so matter-js loads only with this world.
import dynamic from "next/dynamic";
import type { WorldModule } from "@/components/life/multiverse/types";
import { meta } from "./meta";

export const world: WorldModule = {
  meta,
  World: dynamic(() => import("./World"), {
    ssr: false,
    loading: () => <div className="absolute inset-0" style={{ background: meta.bg }} />,
  }),
  Static: dynamic(() => import("./Static")),
};
