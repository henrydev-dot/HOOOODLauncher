import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  "..##........##..",
  ".#AA#......#AA#.",
  ".#AAA######AAA#.",
  "#AAAAAAAAAAAAAA#",
  "#AA#GGGGGGGG#AA#",
  "#A#GGGGGGGGGG#A#",
  "#A#G##GGGG##G#A#",
  "#A#GGGGPPGGGG#A#",
  "#A#GGWWWWWWGG#A#",
  ".#A#GGGGGGGG#A#.",
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
  G: "#9BA0B5",
  W: "#FFFFFF",
  P: "#FF9EC7",
} as const;

export function HoodieCat(props: MascotProps) {
  return <Sprite rows={ROWS} palette={PALETTE} title="Hoodie Cat" {...props} />;
}
