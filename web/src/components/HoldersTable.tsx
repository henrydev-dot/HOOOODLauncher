"use client";

import { useTranslations } from "next-intl";
import type { Holder } from "@/lib/types";
import { compact, shortAddr } from "@/lib/format";

export function HoldersTable({ holders }: { holders: Holder[] }) {
  const t = useTranslations("token");
  return (
    <div className="overflow-x-auto">
      <table className="w-full font-body text-lg tabular">
        <thead>
          <tr className="border-b-2 border-black text-left font-pixel text-[9px] uppercase text-white/40">
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">{t("holderAddr")}</th>
            <th className="py-2 pr-2 text-right">{t("holderAmount")}</th>
            <th className="py-2 text-right">{t("holderPct")}</th>
          </tr>
        </thead>
        <tbody>
          {holders.map((h, i) => (
            <tr key={h.address + i} className="border-b border-white/5">
              <td className="py-1.5 pr-2 text-white/40">{i + 1}</td>
              <td className="py-1.5 pr-2 text-white/80">
                {h.address === "curve" ? (
                  <span className="text-robin">{t("curveLabel")} 🔒</span>
                ) : (
                  shortAddr(h.address)
                )}
              </td>
              <td className="py-1.5 pr-2 text-right text-white/80">
                {compact(h.balance)}
              </td>
              <td className="py-1.5 text-right text-white">{h.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
