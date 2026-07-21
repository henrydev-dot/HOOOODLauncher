import type { ComponentType } from "react";
import type { MascotProps } from "./Sprite";
import { HoodieCat } from "./HoodieCat";
import { PixelFrog } from "./PixelFrog";
import { RobotChef } from "./RobotChef";
import { NeonGhost } from "./NeonGhost";
import { AstroDog } from "./AstroDog";
import { PixelDragon } from "./PixelDragon";
import { HoodiePenguin } from "./HoodiePenguin";
import { ArcadeAlien } from "./ArcadeAlien";
import { PixelBull } from "./PixelBull";
import { NinjaHamster } from "./NinjaHamster";
import { NeonOwl } from "./NeonOwl";
import { HoodieSkeleton } from "./HoodieSkeleton";

export type { MascotProps } from "./Sprite";
export {
  HoodieCat,
  PixelFrog,
  RobotChef,
  NeonGhost,
  AstroDog,
  PixelDragon,
  HoodiePenguin,
  ArcadeAlien,
  PixelBull,
  NinjaHamster,
  NeonOwl,
  HoodieSkeleton,
};

export interface MascotEntry {
  id: string;
  name: string;
  Component: ComponentType<MascotProps>;
}

export const MASCOTS: MascotEntry[] = [
  { id: "hoodie-cat", name: "Hoodie Cat", Component: HoodieCat },
  { id: "pixel-frog", name: "Pixel Frog", Component: PixelFrog },
  { id: "robot-chef", name: "Robot Chef", Component: RobotChef },
  { id: "neon-ghost", name: "Neon Ghost", Component: NeonGhost },
  { id: "astro-dog", name: "Astro Dog", Component: AstroDog },
  { id: "pixel-dragon", name: "Pixel Dragon", Component: PixelDragon },
  { id: "hoodie-penguin", name: "Hoodie Penguin", Component: HoodiePenguin },
  { id: "arcade-alien", name: "Arcade Alien", Component: ArcadeAlien },
  { id: "pixel-bull", name: "Pixel Bull", Component: PixelBull },
  { id: "ninja-hamster", name: "Ninja Hamster", Component: NinjaHamster },
  { id: "neon-owl", name: "Neon Owl", Component: NeonOwl },
  { id: "hoodie-skeleton", name: "Hoodie Skeleton", Component: HoodieSkeleton },
];

export function getMascot(id: string): MascotEntry {
  return MASCOTS.find((m) => m.id === id) ?? MASCOTS[0];
}
