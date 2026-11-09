import type { WorldModule } from "@/components/life/multiverse/types";
import { world as bridge } from "@/components/life/multiverse/bridge";
import { world as anchoring } from "./anchoring";
import { world as sports } from "./sports";
import { world as rubiks } from "./rubiks";
import { world as social } from "./social";
import { world as mun } from "./mun";
import { world as moving } from "./moving";
import { world as minecraft } from "./minecraft";
import { world as startups } from "./startups";
import { world as fitness } from "./fitness";
import { world as jee } from "./jee";
import { world as hackathons } from "./hackathons";
import { world as outro } from "./outro";

/** Play order. The bridge repeats the hero's last frame; the rest are the worlds in age order. */
export const WORLDS: WorldModule[] = [bridge, anchoring, sports, rubiks, social, mun, moving, minecraft, startups, fitness, jee, hackathons, outro];
