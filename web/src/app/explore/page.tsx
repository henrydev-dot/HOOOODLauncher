"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { PixelTabs } from "@/components/ui/PixelTabs";
import { LauncherCard } from "@/components/LauncherCard";
import { TokenCard } from "@/components/TokenCard";

type Tab = "launchers" | "tokens";
type Sort = "volume" | "newest" | "graduation";

export default function ExplorePage() {
  const t = useTranslations("explore");
  const [tab, setTab] = useState<Tab>("launchers");
  const [sort, setSort] = useState<Sort>("volume");

  const { data: launchers } = useQuery({
    queryKey: ["launchers"],
    queryFn: api.launchers,
  });
  const { data: tokens } = useQuery({ queryKey: ["tokens"], queryFn: api.tokens });

  const sortedLaunchers = (launchers ?? []).slice().sort((a, b) => {
    if (sort === "newest") return b.createdAt - a.createdAt;
    return b.volume24h - a.volume24h; // graduation not applicable; volume default
  });

  const sortedTokens = (tokens ?? []).slice().sort((a, b) => {
    if (sort === "newest") return b.createdAt - a.createdAt;
    if (sort === "graduation") {
      const ag = a.graduated ? -1 : a.progressBps;
      const bg = b.graduated ? -1 : b.progressBps;
      return bg - ag;
    }
    return b.volume24h - a.volume24h;
  });

  const launcherOf = (slug: string) =>
    (launchers ?? []).find((l) => l.slug === slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-pixel text-xl text-white">{t("title")}</h1>
      <p className="mt-1 font-body text-xl text-white/50">{t("subtitle")}</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <PixelTabs
          active={tab}
          onChange={(id) => setTab(id as Tab)}
          tabs={[
            { id: "launchers", label: t("tabLaunchers") },
            { id: "tokens", label: t("tabTokens") },
          ]}
        />
        <PixelTabs
          size="sm"
          active={sort}
          onChange={(id) => setSort(id as Sort)}
          tabs={[
            { id: "volume", label: t("sortVolume") },
            { id: "newest", label: t("sortNewest") },
            { id: "graduation", label: t("sortGraduation") },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tab === "launchers"
          ? sortedLaunchers.map((l) => <LauncherCard key={l.slug} launcher={l} />)
          : sortedTokens.map((tok) => (
              <TokenCard
                key={tok.address}
                token={tok}
                themeColor={launcherOf(tok.launcherSlug)?.themeColor}
              />
            ))}
      </div>

      {((tab === "launchers" && sortedLaunchers.length === 0) ||
        (tab === "tokens" && sortedTokens.length === 0)) && (
        <p className="mt-10 text-center font-body text-xl text-white/50">
          {t("empty")}
        </p>
      )}
    </div>
  );
}
