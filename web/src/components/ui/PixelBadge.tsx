import React from "react";

type Tone = "robin" | "mint" | "danger" | "neutral" | "custom";

const tones: Record<Exclude<Tone, "custom">, string> = {
  robin: "bg-robin text-black",
  mint: "bg-mint text-black",
  danger: "bg-danger text-black",
  neutral: "bg-ink text-white/80 border border-white/20",
};

export function PixelBadge({
  tone = "neutral",
  color,
  className = "",
  children,
}: {
  tone?: Tone;
  /** Custom background color (used when tone="custom"). */
  color?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 font-pixel text-[8px] uppercase tracking-wider ${
        tone === "custom" ? "text-black" : tones[tone]
      } ${className}`}
      style={tone === "custom" ? { backgroundColor: color } : undefined}
    >
      {children}
    </span>
  );
}
