import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  "...####..####...",
  "..#bbbb##bbbb#..",
  ".#bbbbbbbbbbbb#.",
  "#AAAAAAAAAAAAAA#",
  "#AAAAAAAAAAAAAA#",
  "#bbb##bbbb##bbb#",
  "#bbbbbb##bbbbbb#",
  "#bbbbWWWWWWbbbb#",
  "#bbbWWWWWWWWbbb#",
  ".#bbWWWWWWWWbb#.",
  ".#bbbWWWWWWbbb#.",
  ".#bbbbbbbbbbbb#.",
  "..#bbbbbbbbbb#..",
  "..#b#bbbbbb#b#..",
  "...##########...",
  "....##....##....",
];

const PALETTE = {
  "#": "#000000",
  b: "#D9A066",
  A: "ACCENT",
  W: "#FFF7E8",
} as const;

export function NinjaHamster(props: MascotProps) {
  return (
    <Sprite rows={ROWS} palette={PALETTE} title="Ninja Hamster" {...props} />
  );
}
