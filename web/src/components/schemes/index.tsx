"use client";

import type { ComponentType, CSSProperties } from "react";
import type { Launcher, LayoutScheme, TokenInfo, Trade } from "@/lib/types";
import { SchemeArcade } from "./SchemeArcade";
import { SchemeTerminal } from "./SchemeTerminal";
import { SchemeVitrine } from "./SchemeVitrine";

export { SchemeArcade, SchemeTerminal, SchemeVitrine };

export interface SchemeProps {
  launcher: Launcher;
  tokens: TokenInfo[];
  trades?: Trade[];
}

export const SCHEMES: Record<LayoutScheme, ComponentType<SchemeProps>> = {
  arcade: SchemeArcade,
  terminal: SchemeTerminal,
  vitrine: SchemeVitrine,
};

/** Wraps a scheme with the launcher's theme color as the CSS accent var. */
export function ThemedScheme(props: SchemeProps) {
  const Scheme = SCHEMES[props.launcher.scheme] ?? SchemeArcade;
  return (
    <div style={{ "--color-robin": props.launcher.themeColor } as CSSProperties}>
      <Scheme {...props} />
    </div>
  );
}
