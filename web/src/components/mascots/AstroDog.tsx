import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  "....########....",
  "..##cccccccc##..",
  ".#cccccccccccc#.",
  ".#c#BB#cc#BB#c#.",
  ".#c#bbbbbbbb#c#.",
  ".#c#b##bb##b#c#.",
  ".#c#bbbbbbbb#c#.",
  ".#c#bbb##bbb#c#.",
  ".#cc#bbbbbb#cc#.",
  "..##cccccccc##..",
  "...##########...",
  "..#AAAAAAAAAA#..",
  ".#AAAA#WW#AAAA#.",
  ".#AAAAAAAAAAAA#.",
  "..#AA#....#AA#..",
  "..####....####..",
];

const PALETTE = {
  "#": "#000000",
  c: "#BFE8FF",
  B: "#5C3A1E",
  b: "#D9A066",
  W: "#FFFFFF",
  A: "ACCENT",
} as const;

export function AstroDog(props: MascotProps) {
  return <Sprite rows={ROWS} palette={PALETTE} title="Astro Dog" {...props} />;
}
