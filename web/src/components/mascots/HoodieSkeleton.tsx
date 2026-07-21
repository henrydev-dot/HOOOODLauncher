import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  "...##########...",
  "..#AAAAAAAAAA#..",
  ".#AAAAAAAAAAAA#.",
  ".#A#WWWWWWWW#A#.",
  ".#A#WWWWWWWW#A#.",
  ".#A#W##WW##W#A#.",
  ".#A#W##WW##W#A#.",
  ".#A#WWW##WWW#A#.",
  ".#A#W#W##W#W#A#.",
  ".#A##WWWWWW##A#.",
  ".#AAAAAAAAAAAA#.",
  ".#AAAAAAAAAAAA#.",
  ".#AA##AAAA##AA#.",
  ".#AAAAAAAAAAAA#.",
  "..#AA#....#AA#..",
  "..####....####..",
];

const PALETTE = {
  "#": "#000000",
  A: "ACCENT",
  W: "#F4F4F8",
} as const;

export function HoodieSkeleton(props: MascotProps) {
  return (
    <Sprite rows={ROWS} palette={PALETTE} title="Hoodie Skeleton" {...props} />
  );
}
