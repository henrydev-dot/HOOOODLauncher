import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  "...##########...",
  "..#WWWWWWWWWW#..",
  ".#WWWWWWWWWWWW#.",
  ".#WWWWWWWWWWWW#.",
  ".##############.",
  ".#GGGGGGGGGGGG#.",
  ".#G#AA#GG#AA#G#.",
  ".#GGGGGGGGGGGG#.",
  ".#GG########GG#.",
  ".##############.",
  "..#GGGGGGGGGG#..",
  ".#GG#AAAAAA#GG#.",
  ".#GG#AAAAAA#GG#.",
  "..#GGGGGGGGGG#..",
  "..#GG#....#GG#..",
  "..####....####..",
];

const PALETTE = {
  "#": "#000000",
  W: "#FFFFFF",
  G: "#8E93A8",
  A: "ACCENT",
} as const;

export function RobotChef(props: MascotProps) {
  return <Sprite rows={ROWS} palette={PALETTE} title="Robot Chef" {...props} />;
}
