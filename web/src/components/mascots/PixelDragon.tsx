import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  "..#..........#..",
  ".#Y#........#Y#.",
  ".#Y#..####..#Y#.",
  ".#Y###gggg###Y#.",
  ".##gggggggggg##.",
  ".#gg#R#gg#R#gg#.",
  ".#gggggggggggg#.",
  ".#gggg#gg#gggg#.",
  ".#gWgWgWgWgWgW#.",
  "..############..",
  "#A#..#gggg#..#A#",
  "#AA#.#gggg#.#AA#",
  "#AAA##gggg##AAA#",
  "#AAAA#gggg#AAAA#",
  "..##..#gg#..##..",
  "......####......",
];

const PALETTE = {
  "#": "#000000",
  Y: "#FFD34D",
  g: "#4E9F3D",
  R: "#FF4D6D",
  W: "#FFFFFF",
  A: "ACCENT",
} as const;

export function PixelDragon(props: MascotProps) {
  return (
    <Sprite rows={ROWS} palette={PALETTE} title="Pixel Dragon" {...props} />
  );
}
