"use client";

import { useTranslations } from "next-intl";
import type { Trade } from "@/lib/types";
import { compact, shortAddr, timeAgo } from "@/lib/format";

export function TradesList({
  trades,
  showToken = false,
}: {
  trades: Trade[];
  showToken?: boolean;
}) {
  const t = useTranslations("common");
  return (
    <div className="divide-y divide-white/5 font-body text-lg">
      {trades.map((tr) => {
        const ago = timeAgo(tr.timestamp);
        return (
          <div key={tr.id} className="flex items-center gap-2 py-1.5 tabular">
            <span
              className={`font-pixel text-[9px] ${
                tr.isBuy ? "text-mint" : "text-danger"
              }`}
            >
              {tr.isBuy ? "▲" : "▼"}
            </span>
            <span className="text-white/50">{shortAddr(tr.trader)}</span>
            <span className={tr.isBuy ? "text-mint" : "text-danger"}>
              {compact(tr.hoodieAmount)} HOODIE
            </span>
            {showToken && (
              <span className="text-white/60">${tr.tokenSymbol}</span>
            )}
            <span className="ml-auto text-white/30">
              {t("timeAgo", { value: ago.v, unit: ago.unit })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
