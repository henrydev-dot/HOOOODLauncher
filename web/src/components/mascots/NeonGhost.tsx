import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  ".....######.....",
  "...##AAAAAA##...",
  "..#AAAAAAAAAA#..",
  ".#AAAAAAAAAAAA#.",
  ".#A#WW#AA#WW#A#.",
  ".#A#W##AA#W##A#.",
  ".#AAAAAAAAAAAA#.",
  "#AAAAAAAAAAAAAA#",
  "#AAAAAAAAAAAAAA#",
  "#AAAAAAAAAAAAAA#",
  "#AAAAAAAAAAAAAA#",
  "#AAAAAAAAAAAAAA#",
  "#AAAAAAAAAAAAAA#",
  "#AAAAAAAAAAAAAA#",
  "#A#.#A#..#A#.#A#",
  "................",
];

const PALETTE = {
  "#": "#000000",
  A: "ACCENT",
  W: "#FFFFFF",
} as const;

export function NeonGhost(props: MascotProps) {
  return <Sprite rows={ROWS} palette={PALETTE} title="Neon Ghost" {...props} />;
}
