"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Launcher, TokenInfo, Trade } from "@/lib/types";
import { getMascot } from "../mascots";
import { PixelButton } from "../ui/PixelButton";
import { TokenCard } from "../TokenCard";

export function SchemeVitrine({
  launcher,
  tokens,
}: {
  launcher: Launcher;
  tokens: TokenInfo[];
  trades?: Trade[];
}) {
  const t = useTranslations("launcher");
  const { Component: Mascot } = getMascot(launcher.mascotId);

  return (
    <div>
      {/* Full-bleed hero */}
      <div
        className="relative overflow-hidden border-b-2 border-black"
        style={{
          background: `linear-gradient(180deg, ${launcher.themeColor}22 0%, transparent 80%)`,
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center">
          <div className="animate-idle-bounce">
            {launcher.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={launcher.logoDataUrl}
                alt={launcher.name}
                className="h-28 w-28 border-2 border-black shadow-pixel"
              />
            ) : (
              <Mascot size={128} color={launcher.themeColor} still />
            )}
          </div>
          <h1
            className="font-pixel text-2xl md:text-3xl"
            style={{ color: launcher.themeColor, textShadow: "4px 4px 0 #000" }}
          >
            {launcher.name}
          </h1>
          <p className="max-w-2xl font-body text-2xl text-white/70">
            {launcher.description}
          </p>
          <Link href={`/${launcher.slug}/create-token`}>
            <PixelButton size="lg">{t("createToken")}</PixelButton>
          </Link>
        </div>
      </div>

      {/* Showcase grid */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-center font-pixel text-sm uppercase text-white/70">
          ★ {t("tokens")} ★
        </h2>
        {tokens.length === 0 ? (
          <p className="mt-4 text-center font-body text-xl text-white/50">
            {t("noTokens")}
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
