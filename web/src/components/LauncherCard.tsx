"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Launcher } from "@/lib/types";
import { getMascot } from "./mascots";
import { PixelPanel } from "./ui/PixelPanel";
import { PixelBadge } from "./ui/PixelBadge";
import { compact } from "@/lib/format";

export function LauncherCard({ launcher }: { launcher: Launcher }) {
  const t = useTranslations("common");
  const te = useTranslations("explore");
  const ts = useTranslations("schemes");
  const { Component: Mascot } = getMascot(launcher.mascotId);

  return (
    <Link href={`/${launcher.slug}`}>
      <PixelPanel className="h-full p-4 transition-transform duration-75 hover:-translate-y-1 hover:border-robin">
        <div className="flex items-center gap-3">
          {launcher.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={launcher.logoDataUrl}
              alt={launcher.name}
              className="h-14 w-14 border-2 border-black"
            />
          ) : (
            <Mascot size={56} color={launcher.themeColor} />
          )}
          <div className="min-w-0">
            <div className="truncate font-pixel text-xs" style={{ color: launcher.themeColor }}>
              {launcher.name}
            </div>
            <div className="font-body text-lg text-white/50">/{launcher.slug}</div>
          </div>
        </div>
        <p className="mt-2 line-clamp-2 font-body text-lg leading-tight text-white/60">
          {launcher.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <PixelBadge tone="custom" color={launcher.themeColor}>
            {ts(launcher.scheme)}
          </PixelBadge>
          <PixelBadge tone="neutral">
            {te("feeBps", { bps: launcher.launcherFeeBps })}
          </PixelBadge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 font-body text-lg tabular">
          <div>
            <div className="text-white/40">{t("tokens")}</div>
            <div className="text-white">{launcher.tokenCount}</div>
          </div>
          <div>
            <div className="text-white/40">{t("volume24h")}</div>
            <div className="text-white">{compact(launcher.volume24h)} HOODIE</div>
          </div>
        </div>
      </PixelPanel>
    </Link>
  );
}
