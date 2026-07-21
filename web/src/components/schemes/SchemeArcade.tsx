"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Launcher, TokenInfo, Trade } from "@/lib/types";
import { getMascot } from "../mascots";
import { PixelPanel } from "../ui/PixelPanel";
import { PixelBadge } from "../ui/PixelBadge";
import { PixelButton } from "../ui/PixelButton";
import { TokenCard } from "../TokenCard";
import { GraduationBar } from "../GraduationBar";
import { compact, fmtPrice } from "@/lib/format";

export function SchemeArcade({
  launcher,
  tokens,
}: {
  launcher: Launcher;
  tokens: TokenInfo[];
  trades?: Trade[];
}) {
  const t = useTranslations("launcher");
  const tc = useTranslations("common");
  const { Component: Mascot } = getMascot(launcher.mascotId);
  const king = launcher.features.kingOfTheHill
    ? [...tokens].sort((a, b) => b.volume24h - a.volume24h)[0]
    : undefined;
  const KingMascot = king ? getMascot(king.mascotId).Component : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Marquee header */}
      <PixelPanel accent className="scanlines overflow-hidden">
        <div className="flex flex-col items-center gap-4 px-6 py-8 text-center md:flex-row md:text-left">
          {launcher.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={launcher.logoDataUrl}
              alt={launcher.name}
              className="h-20 w-20 border-2 border-black"
            />
          ) : (
            <Mascot size={88} color={launcher.themeColor} />
          )}
          <div className="flex-1">
            <h1 className="font-pixel text-xl text-robin md:text-2xl">
              {launcher.name}
            </h1>
            <p className="mt-2 font-body text-xl text-white/70">
              {launcher.description}
            </p>
          </div>
          <Link href={`/${launcher.slug}/create-token`}>
            <PixelButton>{t("createToken")}</PixelButton>
          </Link>
        </div>
      </PixelPanel>

      {/* King of the Hill */}
      {king && KingMascot && (
        <PixelPanel title={`👑 ${t("king")}`} className="mt-6">
          <Link
            href={`/${king.launcherSlug}/token/${king.address}`}
            className="flex flex-col items-center gap-4 p-5 md:flex-row"
          >
            <div className="animate-idle-bounce">
              <KingMascot size={72} color={launcher.themeColor} still />
            </div>
            <div className="min-w-0 flex-1 text-center md:text-left">
              <div className="font-pixel text-sm text-white">
                {king.name}{" "}
                <span className="text-white/40">${king.symbol}</span>
              </div>
              <div className="mt-1 font-body text-lg text-white/60 tabular">
                {tc("volume24h")}: {compact(king.volume24h)} HOODIE ·{" "}
                {tc("price")}: {fmtPrice(king.priceHoodie)}
              </div>
              <div className="mt-3">
                <GraduationBar
                  progressBps={king.progressBps}
                  color={launcher.themeColor}
                />
              </div>
            </div>
            <PixelBadge tone="custom" color={launcher.themeColor}>
              #1
            </PixelBadge>
          </Link>
        </PixelPanel>
      )}

      {/* Token grid */}
      <div className="mt-8">
        <h2 className="font-pixel text-sm uppercase text-white/70">
          {t("tokens")}
        </h2>
        {tokens.length === 0 ? (
          <p className="mt-4 font-body text-xl text-white/50">{t("noTokens")}</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tokens.map((tok) => (
              <TokenCard
                key={tok.address}
                token={tok}
                themeColor={launcher.themeColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
