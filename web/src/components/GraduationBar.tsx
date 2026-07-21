"use client";

import { useTranslations } from "next-intl";
import { PixelProgress } from "./ui/PixelProgress";
import { compact } from "@/lib/format";

export function GraduationBar({
  progressBps,
  realHoodieReserve,
  color = "var(--color-robin)",
  compactMode = false,
}: {
  progressBps: number;
  realHoodieReserve?: number;
  color?: string;
  compactMode?: boolean;
}) {
  const t = useTranslations("token");
  const pct = Math.min(100, progressBps / 100);
  const left =
    realHoodieReserve !== undefined
      ? Math.max(0, 85_000_000 - realHoodieReserve)
      : Math.max(0, 85_000_000 * (1 - pct / 100));

  return (
    <div>
      <PixelProgress
        value={pct}
        segments={compactMode ? 12 : 20}
        color={pct >= 100 ? "var(--color-mint)" : color}
      />
      <div className="mt-1 font-body text-base text-white/60 tabular">
        {pct >= 100
          ? t("graduatedLine")
          : t("graduationLine", {
              pct: pct.toFixed(1),
              amount: compact(left),
            })}
      </div>
    </div>
  );
}
