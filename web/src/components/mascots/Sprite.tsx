import React from "react";

export interface MascotProps {
  /** Accent color (hoodie / body highlight). */
  color?: string;
  /** Rendered size in px. */
  size?: number;
  /** Disable the idle bounce animation. */
  still?: boolean;
  className?: string;
  title?: string;
}

export type Palette = Record<string, string | "ACCENT">;

/**
 * Renders a 16x16 pixel-art grid as crisp SVG rects.
 * `rows` is 16 strings of 16 chars; "." is transparent, other chars map
 * through `palette`. The special palette value "ACCENT" uses the color prop.
 */
export function Sprite({
  rows,
  palette,
  color = "#CCFF00",
  size = 64,
  still = false,
  className = "",
  title,
}: MascotProps & { rows: string[]; palette: Palette }) {
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ".") continue;
      const mapped = palette[ch];
      if (!mapped) continue;
      const fill = mapped === "ACCENT" ? color : mapped;
      cells.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />
      );
    }
  }
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`${still ? "" : "mascot-idle "}${className}`}
      style={{ imageRendering: "pixelated" }}
      role="img"
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {cells}
    </svg>
  );
}
