"use client";

/**
 * Chunky segmented 8-bit progress bar.
 * `value` is 0..100. Renders `segments` hard cells that fill left to right.
 */
export function PixelProgress({
  value,
  segments = 20,
  color = "var(--color-robin)",
  className = "",
  label,
}: {
  value: number;
  segments?: number;
  color?: string;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const filled = Math.round((clamped / 100) * segments);
  return (
    <div className={className} aria-label={label} role="progressbar" aria-valuenow={Math.round(clamped)}>
      <div className="flex gap-[3px] border-2 border-black bg-ink p-[3px] shadow-pixel-sm">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className="h-3 flex-1"
            style={{
              backgroundColor:
                i < filled ? color : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
