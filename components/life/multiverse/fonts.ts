/**
 * Every display face the Life multiverse may use, declared once.
 *
 * `preload: false` keeps them off the critical path: the @font-face rules ship
 * with the page CSS, but a file only downloads when a world actually renders
 * text in that family. Each font exposes a CSS variable (e.g. `--f-anybody`);
 * `FONT_VARIABLES` is applied on the multiverse root so any world can write
 * `style={{ fontFamily: "var(--f-anybody)" }}`.
 */
import {
  Anton,
  Anybody,
  Archivo,
  Bagel_Fat_One,
  Big_Shoulders,
  Caveat,
  Cinzel,
  Courier_Prime,
  DM_Mono,
  Doto,
  Fraunces,
  IBM_Plex_Mono,
  Instrument_Serif,
  JetBrains_Mono,
  Martian_Mono,
  Monoton,
  Nabla,
  Permanent_Marker,
  Pixelify_Sans,
  Rubik_Mono_One,
  Share_Tech_Mono,
  Silkscreen,
  Space_Mono,
  Tilt_Warp,
  Unbounded,
} from "next/font/google";

export const anybody = Anybody({ subsets: ["latin"], display: "swap", preload: false, axes: ["wdth"], style: ["normal", "italic"], variable: "--f-anybody" });
export const anton = Anton({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--f-anton" });
export const archivo = Archivo({ subsets: ["latin"], display: "swap", preload: false, axes: ["wdth"], variable: "--f-archivo" });
export const bagel = Bagel_Fat_One({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--f-bagel" });
export const bigShoulders = Big_Shoulders({ subsets: ["latin"], display: "swap", preload: false, axes: ["opsz"], variable: "--f-big-shoulders" });
export const caveat = Caveat({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-caveat" });
export const cinzel = Cinzel({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-cinzel" });
export const courierPrime = Courier_Prime({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"], variable: "--f-courier" });
export const dmMono = DM_Mono({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500"], variable: "--f-dm-mono" });
export const doto = Doto({ subsets: ["latin"], display: "swap", preload: false, axes: ["ROND"], variable: "--f-doto" });
export const fraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, axes: ["SOFT", "WONK", "opsz"], style: ["normal", "italic"], variable: "--f-fraunces" });
export const plexMono = IBM_Plex_Mono({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500", "700"], variable: "--f-plex-mono" });
export const instrumentSerif = Instrument_Serif({ subsets: ["latin"], display: "swap", preload: false, weight: "400", style: ["normal", "italic"], variable: "--f-instrument" });
export const jetbrains = JetBrains_Mono({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-jetbrains" });
export const martianMono = Martian_Mono({ subsets: ["latin"], display: "swap", preload: false, axes: ["wdth"], variable: "--f-martian" });
export const monoton = Monoton({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--f-monoton" });
export const nabla = Nabla({ subsets: ["latin"], display: "swap", preload: false, axes: ["EDPT", "EHLT"], variable: "--f-nabla" });
export const permanentMarker = Permanent_Marker({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--f-marker" });
export const pixelify = Pixelify_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-pixelify" });
export const rubikMono = Rubik_Mono_One({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--f-rubik-mono" });
export const shareTechMono = Share_Tech_Mono({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--f-share-tech" });
export const silkscreen = Silkscreen({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"], variable: "--f-silkscreen" });
export const spaceMono = Space_Mono({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"], variable: "--f-space-mono" });
export const tiltWarp = Tilt_Warp({ subsets: ["latin"], display: "swap", preload: false, axes: ["XROT", "YROT"], variable: "--f-tilt-warp" });
export const unbounded = Unbounded({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-unbounded" });

/** Class list that defines every `--f-*` variable. Put it on the multiverse root. */
export const FONT_VARIABLES = [
  anybody, anton, archivo, bagel, bigShoulders, caveat, cinzel, courierPrime, dmMono, doto, fraunces,
  plexMono, instrumentSerif, jetbrains, martianMono, monoton, nabla, permanentMarker, pixelify,
  rubikMono, shareTechMono, silkscreen, spaceMono, tiltWarp, unbounded,
]
  .map((f) => f.variable)
  .join(" ");
