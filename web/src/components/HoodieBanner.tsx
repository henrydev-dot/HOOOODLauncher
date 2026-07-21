"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HOODIE_ADDRESS, HOODIE_LINKS } from "@/lib/config";
import { activeChain } from "@/lib/wagmi";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelBadge } from "@/components/ui/PixelBadge";
import { HoodieCat } from "@/components/mascots/HoodieCat";

/** $HOODIE token card on the home page: address, network, buy/chart links. */
export function HoodieBanner() {
  const t = useTranslations("home");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(HOODIE_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <PixelPanel className="border-robin/60 p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <HoodieCat size={64} color="#CCFF00" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-pixel text-sm text-robin">$HOODIE</span>
                <PixelBadge tone="robin">{activeChain.name}</PixelBadge>
              </div>
              <p className="mt-2 max-w-md font-body text-lg text-white/60">
                {t("hoodieDesc")}
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex flex-col gap-3">
            <button
              onClick={copy}
              className="border-2 border-black bg-black/40 px-3 py-2 text-left font-body text-base text-white/70 shadow-pixel transition-transform hover:-translate-y-px"
              title={t("hoodieCopy")}
            >
              <span className="mr-2 font-pixel text-[9px] uppercase text-white/40">
                CA
              </span>
              <span className="break-all tabular">{HOODIE_ADDRESS}</span>
              <span className="ml-2 text-robin">
                {copied ? "✓" : "⧉"}
              </span>
            </button>
            <div className="flex flex-wrap gap-3">
              <a href={HOODIE_LINKS.buy} target="_blank" rel="noreferrer">
                <PixelButton size="sm">{t("hoodieBuy")}</PixelButton>
              </a>
              <a
                href={HOODIE_LINKS.dexscreener}
                target="_blank"
                rel="noreferrer"
              >
                <PixelButton size="sm" variant="ghost">
                  DexScreener
                </PixelButton>
              </a>
              <a href={HOODIE_LINKS.explorer} target="_blank" rel="noreferrer">
                <PixelButton size="sm" variant="ghost">
                  Blockscout
                </PixelButton>
              </a>
            </div>
          </div>
        </div>
      </PixelPanel>
    </section>
  );
}
