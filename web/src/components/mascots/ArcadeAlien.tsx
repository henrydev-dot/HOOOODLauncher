import { Sprite, type MascotProps } from "./Sprite";

const ROWS = [
  "....A.....A.....",
  "....A.....A.....",
  ".....A...A......",
  ".....A...A......",
  "....AAAAAAA.....",
  "....AAAAAAA.....",
  "...AA.AAA.AA....",
  "...AA.AAA.AA....",
  "..AAAAAAAAAAA...",
  "..AAAAAAAAAAA...",
  "..A.AAAAAAA.A...",
  "..A.AAAAAAA.A...",
  "..A.A.....A.A...",
  "..A.A.....A.A...",
  ".....AA.AA......",
  ".....AA.AA......",
];

const PALETTE = {
  A: "ACCENT",
} as const;

export function ArcadeAlien(props: MascotProps) {
  return (
    <Sprite rows={ROWS} palette={PALETTE} title="Arcade Alien" {...props} />
  );
}
