import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  "...##########...",
  "..#AAAAAAAAAA#..",
  ".#AAAAAAAAAAAA#.",
  ".#A#DDDDDDDD#A#.",
  ".#A#DWWDDWWD#A#.",
  ".#A#DW#DD#WD#A#.",
  ".#A#DDOOOODD#A#.",
  ".#AA#DDOODD#AA#.",
  ".#AAAAAAAAAAAA#.",
  ".#A#DWWWWWWD#A#.",
  ".#A#DWWWWWWD#A#.",
  ".#A#DWWWWWWD#A#.",
  ".#A#DDWWWWDD#A#.",
  ".#AADDDDDDDDAA#.",
  "..############..",
  "...#OO#..#OO#...",
];

const PALETTE = {
  "#": "#000000",
  A: "ACCENT",
  D: "#2E2E3E",
  W: "#FFFFFF",
  O: "#FF9E00",
} as const;

export function HoodiePenguin(props: MascotProps) {
  return (
    <Sprite rows={ROWS} palette={PALETTE} title="Hoodie Penguin" {...props} />
  );
}
