import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  "..##........##..",
  ".#gg#......#gg#.",
  ".#gWW#....#WWg#.",
  ".#gW##....##Wg#.",
  ".#gggggggggggg#.",
  "#gggggggggggggg#",
  "#gggggggggggggg#",
  "#gAAggggggggAAg#",
  "#g############g#",
  "#gggggggggggggg#",
  ".#gggAAAAAAggg#.",
  ".#ggAAAAAAAAgg#.",
  ".#ggAAAAAAAAgg#.",
  ".#gggggggggggg#.",
  "..#ggg#..#ggg#..",
  ".#####....#####.",
];

const PALETTE = {
  "#": "#000000",
  g: "#5DBB46",
  W: "#FFFFFF",
  A: "ACCENT",
} as const;

export function PixelFrog(props: MascotProps) {
  return <Sprite rows={ROWS} palette={PALETTE} title="Pixel Frog" {...props} />;
}
