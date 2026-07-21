import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  ".##..........##.",
  "#AA#........#AA#",
  "#AAA########AAA#",
  "#AADDDDDDDDDDAA#",
  ".#DYYYYDDYYYYD#.",
  ".#DY##YDDY##YD#.",
  ".#DYYYYDDYYYYD#.",
  ".#DDDDDOODDDDD#.",
  ".#ADDDDDDDDDDA#.",
  ".#ADWDWDWDWDWA#.",
  ".#ADDWDWDWDWDA#.",
  ".#ADWDWDWDWDWA#.",
  ".#AADDDDDDDDAA#.",
  "..#ADDDDDDDDA#..",
  "...##########...",
  "....#OO##OO#....",
];

const PALETTE = {
  "#": "#000000",
  A: "ACCENT",
  D: "#3A3050",
  Y: "#FFD34D",
  O: "#FF9E00",
  W: "#EDE7FF",
} as const;

export function NeonOwl(props: MascotProps) {
  return <Sprite rows={ROWS} palette={PALETTE} title="Neon Owl" {...props} />;
}
