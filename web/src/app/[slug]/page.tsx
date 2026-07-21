"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { ThemedScheme } from "@/components/schemes";
import { PixelButton } from "@/components/ui/PixelButton";
import { NeonGhost } from "@/components/mascots";

export default function LauncherPage({
  params,
}: {
  params: { slug: string };
}) {
  const t = useTranslations("launcher");
  const tc = useTranslations("common");
  const slug = params.slug;

  const { data: launcher, isLoading } = useQuery({
    queryKey: ["launcher", slug],
    queryFn: () => api.launcher(slug),
  });
  const { data: tokens } = useQuery({
    queryKey: ["launcher-tokens", slug],
    queryFn: () => api.launcherTokens(slug),
  });
  const { data: trades } = useQuery({
    queryKey: ["launcher-trades", slug],
    queryFn: () => api.launcherTrades(slug),
    refetchInterval: 20_000,
  });

  if (isLoading) {
    return (
      <p className="py-24 text-center font-body text-2xl text-white/50">
        {tc("loading")}
      </p>
    );
  }

  if (!launcher) {
    return (
      <div className="flex flex-col items-center gap-6 py-24 text-center">
        <NeonGhost size={96} color="#FF4D6D" />
        <h1 className="font-pixel text-lg text-danger">{t("notFoundTitle")}</h1>
        <p className="font-body text-xl text-white/60">{t("notFoundDesc")}</p>
        <Link href="/create">
          <PixelButton>{tc("backHome")}</PixelButton>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ThemedScheme
        launcher={launcher}
        tokens={tokens ?? []}
        trades={trades ?? []}
      />
      <div className="mx-auto max-w-7xl px-4 pb-8 text-right">
        <Link
          href={`/${slug}/admin`}
          className="font-body text-lg text-white/30 hover:text-robin"
        >
          ⚙ {t("adminPanel")}
        </Link>
      </div>
    </div>
  );
}
