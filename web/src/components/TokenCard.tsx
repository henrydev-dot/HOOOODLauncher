"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { TokenInfo } from "@/lib/types";
import { getMascot } from "./mascots";
import { PixelPanel } from "./ui/PixelPanel";
import { PixelBadge } from "./ui/PixelBadge";
import { GraduationBar } from "./GraduationBar";
import { compact, fmtPrice, shortAddr } from "@/lib/format";

export function TokenCard({
  token,
  themeColor = "#CCFF00",
}: {
  token: TokenInfo;
  themeColor?: string;
}) {
  const t = useTranslations("common");
  const tl = useTranslations("launcher");
  const { Component: Mascot } = getMascot(token.mascotId);

  return (
    <Link href={`/${token.launcherSlug}/token/${token.address}`}>
      <PixelPanel className="h-full p-4 transition-transform duration-75 hover:-translate-y-1 hover:border-robin">
        <div className="flex items-start gap-3">
          {token.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={token.logoDataUrl}
              alt={token.name}
              className="h-14 w-14 border-2 border-black"
            />
          ) : (
            <Mascot size={56} color={themeColor} />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-pixel text-[11px] text-white">
                {token.name}
              </span>
              {token.graduated && (
                <PixelBadge tone="mint">{tl("graduatedTag")}</PixelBadge>
              )}
            </div>
            <div className="font-body text-lg text-white/50 tabular">
              ${token.symbol} · {tl("byCreator")} {shortAddr(token.creator)}
            </div>
          </div>
        </div>
        <p className="mt-2 line-clamp-2 font-body text-lg leading-tight text-white/60">
          {token.description}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 font-body text-lg tabular">
          <div>
            <div className="text-white/40">{t("marketCap")}</div>
            <div className="text-white">{compact(token.marketCapHoodie)} HOODIE</div>
          </div>
          <div>
            <div className="text-white/40">{t("price")}</div>
            <div className="text-white">{fmtPrice(token.priceHoodie)}</div>
          </div>
        </div>
        <div className="mt-3">
          <GraduationBar
            progressBps={token.progressBps}
            color={themeColor}
            compactMode
          />
        </div>
      </PixelPanel>
    </Link>
  );
}
