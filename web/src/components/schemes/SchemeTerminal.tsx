"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Launcher, TokenInfo, Trade } from "@/lib/types";
import { PixelPanel } from "../ui/PixelPanel";
import { PixelBadge } from "../ui/PixelBadge";
import { TradesList } from "../TradesList";
import { GraduationBar } from "../GraduationBar";
import { compact, fmtPrice } from "@/lib/format";

export function SchemeTerminal({
  launcher,
  tokens,
  trades = [],
}: {
  launcher: Launcher;
  tokens: TokenInfo[];
  trades?: Trade[];
}) {
  const t = useTranslations("launcher");
  const tc = useTranslations("common");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 font-body">
      {/* Terminal header */}
      <div className="border-2 border-robin bg-black shadow-pixel-robin">
        <div className="flex items-center gap-2 border-b-2 border-robin/40 px-3 py-1.5">
          <span className="h-3 w-3 bg-danger" />
          <span className="h-3 w-3 bg-[#FF9E00]" />
          <span className="h-3 w-3 bg-mint" />
          <span className="ml-2 font-body text-lg text-robin/80">
            hoodiepad://{launcher.slug}
          </span>
        </div>
        <div className="px-5 py-5">
          <div className="font-body text-2xl text-robin term-cursor">
            &gt; {launcher.name}
          </div>
          <p className="mt-1 font-body text-xl text-robin/60">
            {launcher.description}
          </p>
          <Link
            href={`/${launcher.slug}/create-token`}
            className="mt-3 inline-block border-2 border-robin px-4 py-2 font-pixel text-[10px] uppercase text-robin hover:bg-robin hover:text-black"
          >
            $ {t("createToken")}
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Token table */}
        <div className="border-2 border-black bg-black/60 shadow-pixel">
          <div className="border-b-2 border-black px-4 py-2 font-body text-lg text-robin/80">
            &gt; ls ./{t("tokens").toLowerCase()} ({tokens.length})
          </div>
          {tokens.length === 0 ? (
            <p className="px-4 py-6 text-xl text-white/50">{t("noTokens")}</p>
          ) : (
            <div className="divide-y divide-white/5">
              {tokens.map((tok) => (
                <Link
                  key={tok.address}
                  href={`/${tok.launcherSlug}/token/${tok.address}`}
                  className="flex flex-col gap-2 px-4 py-3 hover:bg-robin/5 md:flex-row md:items-center"
                >
                  <div className="w-40 shrink-0">
                    <span className="text-xl text-robin">${tok.symbol}</span>
                    {tok.graduated && (
                      <PixelBadge tone="mint" className="ml-2">
                        {t("graduatedTag")}
                      </PixelBadge>
                    )}
                    <div className="text-base text-white/40">{tok.name}</div>
                  </div>
                  <div className="grid flex-1 grid-cols-3 gap-2 text-lg tabular">
                    <div>
                      <span className="text-white/30">{tc("price")} </span>
                      <span className="text-white">{fmtPrice(tok.priceHoodie)}</span>
                    </div>
                    <div>
                      <span className="text-white/30">{tc("volume24h")} </span>
                      <span className="text-white">{compact(tok.volume24h)}</span>
                    </div>
                    <div>
                      <span className="text-white/30">{tc("marketCap")} </span>
                      <span className="text-white">{compact(tok.marketCapHoodie)}</span>
                    </div>
                  </div>
                  <div className="w-full md:w-56">
                    <GraduationBar
                      progressBps={tok.progressBps}
                      color={launcher.themeColor}
                      compactMode
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Live ticker sidebar */}
        {launcher.features.liveTicker && (
          <PixelPanel title={`▓ ${t("liveTrades")}`} className="h-fit">
            <div className="max-h-[480px] overflow-y-auto px-4 py-2">
              <TradesList trades={trades} showToken />
            </div>
          </PixelPanel>
        )}
      </div>
    </div>
  );
}
