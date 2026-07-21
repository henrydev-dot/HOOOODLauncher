import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  "##............##",
  "#W#..........#W#",
  "#W##........##W#",
  "#WW####BB####WW#",
  ".#WW#BBBBBB#WW#.",
  "..##BBBBBBBB##..",
  ".#BBBBBBBBBBBB#.",
  ".#B#RR#BB#RR#B#.",
  ".#BBBBBBBBBBBB#.",
  ".#BBPPPPPPPPBB#.",
  ".#BP#PP##PP#PB#.",
  ".#BBPPPPPPPPBB#.",
  "..############..",
  "...#AAAAAAAA#...",
  "...#AAAAAAAA#...",
  "...##########...",
];

const PALETTE = {
  "#": "#000000",
  W: "#FFFFFF",
  B: "#8A4A2B",
  R: "#FF4D6D",
  P: "#FF9EC7",
  A: "ACCENT",
} as const;

export function PixelBull(props: MascotProps) {
  return <Sprite rows={ROWS} palette={PALETTE} title="Pixel Bull" {...props} />;
}
